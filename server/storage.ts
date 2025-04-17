import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  resellers, type Reseller, type InsertReseller,
  consignments, type Consignment, type InsertConsignment,
  consignmentItems, type ConsignmentItem, type InsertConsignmentItem,
  sales, type Sale, type InsertSale,
  activities, type Activity, type InsertActivity,
  shirtTypes, shirtSizes
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  
  // Reseller operations
  getResellers(): Promise<Reseller[]>;
  getReseller(id: number): Promise<Reseller | undefined>;
  createReseller(reseller: InsertReseller): Promise<Reseller>;
  updateReseller(id: number, reseller: Partial<Reseller>): Promise<Reseller>;
  
  // Consignment operations
  getConsignments(): Promise<Consignment[]>;
  getActiveConsignments(): Promise<Consignment[]>;
  getConsignment(id: number): Promise<Consignment | undefined>;
  getConsignmentByCode(code: string): Promise<Consignment | undefined>;
  createConsignment(consignment: InsertConsignment): Promise<Consignment>;
  updateConsignment(id: number, consignment: Partial<Consignment>): Promise<Consignment>;
  
  // Consignment item operations
  getConsignmentItems(consignmentId: number): Promise<ConsignmentItem[]>;
  createConsignmentItem(item: InsertConsignmentItem): Promise<ConsignmentItem>;
  updateConsignmentItem(id: number, item: Partial<ConsignmentItem>): Promise<ConsignmentItem>;
  
  // Sales operations
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSaleByCode(code: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  deleteSale(id: number): Promise<boolean>;
  
  // Activity operations
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Statistics operations
  getProductStats(): Promise<any>;
  getConsignmentStats(): Promise<any>;
  getSalesStats(): Promise<any>;
  
  // Report operations
  getReportData(reportType: string, startDate: string, endDate: string): Promise<any>;
  
  // Settings operations
  getSettings(): Promise<any>;
  updateSettings(settings: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private resellers: Map<number, Reseller>;
  private consignments: Map<number, Consignment>;
  private consignmentItems: Map<number, ConsignmentItem>;
  private sales: Map<number, Sale>;
  private activities: Activity[];
  private settings: any;
  
  private currentId: {
    user: number;
    product: number;
    reseller: number;
    consignment: number;
    consignmentItem: number;
    sale: number;
    activity: number;
  };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.resellers = new Map();
    this.consignments = new Map();
    this.consignmentItems = new Map();
    this.sales = new Map();
    this.activities = [];
    this.settings = {
      username: "admin",
      businessName: "Kaos Inventory",
      phoneNumber: "0812-3456-7890",
      address: "Jl. Inventori No. 123, Jakarta",
      lowStockThreshold: 30,
      criticalStockThreshold: 10,
      emailNotifications: true,
      lowStockAlerts: true,
      reportSummary: false,
      consignmentReminders: true
    };
    
    this.currentId = {
      user: 1,
      product: 1,
      reseller: 1,
      consignment: 1,
      consignmentItem: 1,
      sale: 1,
      activity: 1
    };
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123"
    });
    
    // Create some initial sample data
    this.initSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductByCode(code: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      product => product.productCode === code
    );
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId.product++;
    const createdAt = new Date();
    const product: Product = { ...insertProduct, id, createdAt };
    this.products.set(id, product);
    
    // Create activity for product addition
    await this.createActivity({
      activityType: "stok",
      description: `Tambah stok ${product.type} ${product.size} (${product.stock} pcs)`,
      relatedId: product.id
    });
    
    return product;
  }
  
  async updateProduct(id: number, updatedProduct: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }
    
    const oldStock = product.stock;
    const newProduct = { ...product, ...updatedProduct };
    this.products.set(id, newProduct);
    
    // Create activity for stock update if stock changed
    if (oldStock !== newProduct.stock) {
      const stockDiff = newProduct.stock - oldStock;
      const action = stockDiff > 0 ? "Tambah" : "Kurang";
      
      await this.createActivity({
        activityType: "stok",
        description: `${action} stok ${newProduct.type} ${newProduct.size} (${Math.abs(stockDiff)} pcs)`,
        relatedId: newProduct.id
      });
    }
    
    return newProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) {
      return false;
    }
    
    // Check if product is in any consignment
    const consignmentItems = Array.from(this.consignmentItems.values())
      .filter(item => item.productId === id);
    
    if (consignmentItems.length > 0) {
      throw new Error("Produk sedang dalam konsinyasi, tidak dapat dihapus");
    }
    
    // Create activity for product deletion
    await this.createActivity({
      activityType: "hapus",
      description: `Hapus produk ${product.type} ${product.size}`,
      relatedId: product.id
    });
    
    return this.products.delete(id);
  }
  
  async getLowStockProducts(threshold: number = 30): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.stock <= threshold);
  }
  
  // Reseller operations
  async getResellers(): Promise<Reseller[]> {
    return Array.from(this.resellers.values());
  }
  
  async getReseller(id: number): Promise<Reseller | undefined> {
    return this.resellers.get(id);
  }
  
  async createReseller(insertReseller: InsertReseller): Promise<Reseller> {
    const id = this.currentId.reseller++;
    const createdAt = new Date();
    const reseller: Reseller = { ...insertReseller, id, createdAt };
    this.resellers.set(id, reseller);
    
    // Create activity
    await this.createActivity({
      activityType: "konsinyasi",
      description: `Reseller baru: ${reseller.name}`,
      relatedId: reseller.id
    });
    
    return reseller;
  }
  
  async updateReseller(id: number, updatedReseller: Partial<Reseller>): Promise<Reseller> {
    const reseller = this.resellers.get(id);
    if (!reseller) {
      throw new Error("Reseller tidak ditemukan");
    }
    
    const newReseller = { ...reseller, ...updatedReseller };
    this.resellers.set(id, newReseller);
    
    return newReseller;
  }
  
  // Consignment operations
  async getConsignments(): Promise<Consignment[]> {
    const consignments = Array.from(this.consignments.values());
    
    // Attach reseller data to each consignment
    return await Promise.all(consignments.map(async consignment => {
      const reseller = await this.getReseller(consignment.resellerId);
      const items = await this.getConsignmentItems(consignment.id);
      
      // Attach product data to each item
      const itemsWithProducts = await Promise.all(items.map(async item => {
        const product = await this.getProduct(item.productId);
        return { ...item, product };
      }));
      
      return { ...consignment, reseller, items: itemsWithProducts };
    }));
  }
  
  async getActiveConsignments(): Promise<Consignment[]> {
    const consignments = await this.getConsignments();
    return consignments.filter(consignment => 
      consignment.status === "aktif" || consignment.status === "sebagian"
    );
  }
  
  async getConsignment(id: number): Promise<Consignment | undefined> {
    const consignment = this.consignments.get(id);
    if (!consignment) return undefined;
    
    const reseller = await this.getReseller(consignment.resellerId);
    const items = await this.getConsignmentItems(consignment.id);
    
    // Attach product data to each item
    const itemsWithProducts = await Promise.all(items.map(async item => {
      const product = await this.getProduct(item.productId);
      return { ...item, product };
    }));
    
    return { ...consignment, reseller, items: itemsWithProducts };
  }
  
  async getConsignmentByCode(code: string): Promise<Consignment | undefined> {
    const consignment = Array.from(this.consignments.values())
      .find(consignment => consignment.consignmentCode === code);
    
    if (!consignment) return undefined;
    
    return this.getConsignment(consignment.id);
  }
  
  async createConsignment(insertConsignment: InsertConsignment): Promise<Consignment> {
    const id = this.currentId.consignment++;
    const takenDate = new Date();
    const consignment: Consignment = { 
      ...insertConsignment, 
      id, 
      paidAmount: 0, 
      status: "aktif", 
      takenDate 
    };
    
    this.consignments.set(id, consignment);
    
    // Create activity
    const reseller = await this.getReseller(consignment.resellerId);
    await this.createActivity({
      activityType: "konsinyasi",
      description: `Konsinyasi baru: ${reseller?.name} (${consignment.totalItems} pcs)`,
      relatedId: consignment.id
    });
    
    return consignment;
  }
  
  async updateConsignment(id: number, updatedConsignment: Partial<Consignment>): Promise<Consignment> {
    const consignment = this.consignments.get(id);
    if (!consignment) {
      throw new Error("Konsinyasi tidak ditemukan");
    }
    
    const newConsignment = { ...consignment, ...updatedConsignment };
    this.consignments.set(id, newConsignment);
    
    return newConsignment;
  }
  
  // Consignment item operations
  async getConsignmentItems(consignmentId: number): Promise<ConsignmentItem[]> {
    return Array.from(this.consignmentItems.values())
      .filter(item => item.consignmentId === consignmentId);
  }
  
  async createConsignmentItem(insertItem: InsertConsignmentItem): Promise<ConsignmentItem> {
    const id = this.currentId.consignmentItem++;
    const item: ConsignmentItem = { ...insertItem, id, returnedQuantity: 0 };
    this.consignmentItems.set(id, item);
    
    // Update product's consigned quantity
    const product = await this.getProduct(item.productId);
    if (product) {
      const updatedStock = product.stock - item.quantity;
      if (updatedStock < 0) {
        throw new Error(`Stok ${product.type} ${product.size} tidak mencukupi`);
      }
      await this.updateProduct(product.id, { stock: updatedStock });
    }
    
    return item;
  }
  
  async updateConsignmentItem(id: number, updatedItem: Partial<ConsignmentItem>): Promise<ConsignmentItem> {
    const item = this.consignmentItems.get(id);
    if (!item) {
      throw new Error("Item konsinyasi tidak ditemukan");
    }
    
    // If returnedQuantity is updated, update product stock
    if (updatedItem.returnedQuantity !== undefined && 
        updatedItem.returnedQuantity > item.returnedQuantity) {
      
      const returnQuantity = updatedItem.returnedQuantity - item.returnedQuantity;
      const product = await this.getProduct(item.productId);
      
      if (product) {
        await this.updateProduct(product.id, { 
          stock: product.stock + returnQuantity 
        });
      }
    }
    
    const newItem = { ...item, ...updatedItem };
    this.consignmentItems.set(id, newItem);
    
    return newItem;
  }
  
  // Sales operations
  async getSales(): Promise<Sale[]> {
    const salesList = Array.from(this.sales.values());
    
    return await Promise.all(salesList.map(async sale => {
      if (sale.consignmentId) {
        const consignment = await this.getConsignment(sale.consignmentId);
        return { ...sale, consignment };
      }
      return sale;
    }));
  }
  
  async getSale(id: number): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    if (sale.consignmentId) {
      const consignment = await this.getConsignment(sale.consignmentId);
      return { ...sale, consignment };
    }
    
    return sale;
  }
  
  async getSaleByCode(code: string): Promise<Sale | undefined> {
    const sale = Array.from(this.sales.values())
      .find(sale => sale.saleCode === code);
    
    if (!sale) return undefined;
    
    return this.getSale(sale.id);
  }
  
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentId.sale++;
    const saleDate = new Date();
    const sale: Sale = { ...insertSale, id, saleDate };
    this.sales.set(id, sale);
    
    // Create activity
    let activityDescription = "";
    if (sale.consignmentId) {
      const consignment = await this.getConsignment(sale.consignmentId);
      activityDescription = `Penjualan konsinyasi: ${consignment?.reseller?.name} (${sale.amount})`;
    } else {
      activityDescription = `Penjualan langsung: ${sale.amount}`;
    }
    
    await this.createActivity({
      activityType: "penjualan",
      description: activityDescription,
      relatedId: sale.id
    });
    
    return sale;
  }
  
  async deleteSale(id: number): Promise<boolean> {
    const sale = this.sales.get(id);
    if (!sale) {
      return false;
    }
    
    // Create activity for sale deletion
    await this.createActivity({
      activityType: "hapus",
      description: `Hapus penjualan: ${sale.saleCode}`,
      relatedId: sale.id
    });
    
    return this.sales.delete(id);
  }
  
  // Activity operations
  async getActivities(limit: number = 10): Promise<Activity[]> {
    return this.activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId.activity++;
    const timestamp = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp };
    this.activities.push(activity);
    return activity;
  }
  
  // Statistics operations
  async getProductStats(): Promise<any> {
    const products = await this.getProducts();
    
    // Get total stock
    const totalStock = products.reduce((total, product) => total + product.stock, 0);
    
    // Get total consigned items
    const consignmentItems = Array.from(this.consignmentItems.values());
    const totalConsigned = consignmentItems.reduce((total, item) => {
      return total + (item.quantity - item.returnedQuantity);
    }, 0);
    
    return {
      totalStock,
      totalConsigned,
      productCount: products.length,
      lowStockCount: products.filter(p => p.stock <= this.settings.lowStockThreshold).length,
      criticalStockCount: products.filter(p => p.stock <= this.settings.criticalStockThreshold).length
    };
  }
  
  async getConsignmentStats(): Promise<any> {
    const consignments = await this.getConsignments();
    const activeConsignments = consignments.filter(c => 
      c.status === "aktif" || c.status === "sebagian"
    );
    
    // Get total consigned items
    const totalConsigned = consignments.reduce((total, consignment) => {
      return total + consignment.totalItems;
    }, 0);
    
    // Get number of active resellers
    const activeResellerIds = new Set(
      activeConsignments.map(c => c.resellerId)
    );
    
    // Calculate pending payment
    const pendingPayment = activeConsignments.reduce((total, consignment) => {
      return total + (consignment.totalValue - consignment.paidAmount);
    }, 0);
    
    return {
      totalConsigned,
      activeResellers: activeResellerIds.size,
      pendingPayment,
      consignmentCount: consignments.length,
      activeConsignmentCount: activeConsignments.length
    };
  }
  
  async getSalesStats(): Promise<any> {
    const sales = await this.getSales();
    const currentDate = new Date();
    
    // Today's sales
    const todayStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    
    const dailySales = sales
      .filter(sale => sale.saleDate >= todayStart)
      .reduce((total, sale) => total + sale.amount, 0);
    
    // This month's sales
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    
    const monthlySales = sales
      .filter(sale => sale.saleDate >= monthStart)
      .reduce((total, sale) => total + sale.amount, 0);
    
    // Total items sold (rough estimate)
    const totalItemsSold = Math.round(
      sales.reduce((total, sale) => total + sale.amount, 0) / 100000
    );
    
    return {
      dailySales,
      monthlySales,
      totalSales: sales.reduce((total, sale) => total + sale.amount, 0),
      totalTransactions: sales.length,
      totalItemsSold
    };
  }
  
  // Report operations
  async getReportData(reportType: string, startDate: string, endDate: string): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day
    
    if (reportType === "sales") {
      const sales = await this.getSales();
      const filteredSales = sales.filter(sale => 
        sale.saleDate >= start && sale.saleDate <= end
      );
      
      // Total sales amount
      const totalSales = filteredSales.reduce((total, sale) => total + sale.amount, 0);
      
      // Sales by type
      const directSales = filteredSales
        .filter(sale => !sale.consignmentId)
        .reduce((total, sale) => total + sale.amount, 0);
        
      const consignmentSales = filteredSales
        .filter(sale => sale.consignmentId)
        .reduce((total, sale) => total + sale.amount, 0);
      
      // Sales by product type
      const productSales = await this.getSalesByProductType(filteredSales);
      
      // Format data for charts
      const chartData = this.getTimeSeriesData(filteredSales, start, end);
      
      return {
        totalSales,
        totalTransactions: filteredSales.length,
        averageTransaction: filteredSales.length ? totalSales / filteredSales.length : 0,
        directSales,
        consignmentSales,
        percentChange: 5.2, // Placeholder
        items: filteredSales,
        chartData,
        productData: Object.entries(productSales).map(([name, value]) => ({ name, value }))
      };
    } 
    else if (reportType === "inventory") {
      const products = await this.getProducts();
      
      // Group products by type
      const productsByType: Record<string, number> = {};
      products.forEach(product => {
        productsByType[product.type] = (productsByType[product.type] || 0) + product.stock;
      });
      
      // Calculate metrics
      const totalStock = products.reduce((total, product) => total + product.stock, 0);
      const lowStockCount = products.filter(p => p.stock <= this.settings.lowStockThreshold).length;
      const criticalStockCount = products.filter(p => p.stock <= this.settings.criticalStockThreshold).length;
      
      // Format data for charts
      const chartData = Object.entries(productsByType).map(([name, value]) => ({ name, value }));
      
      return {
        totalStock,
        totalProducts: products.length,
        lowStockCount,
        criticalStockCount,
        percentChange: 2.8, // Placeholder
        items: products,
        chartData,
        productData: Object.entries(productsByType).map(([name, value]) => ({ name, value }))
      };
    }
    else if (reportType === "consignment") {
      const consignments = await this.getConsignments();
      const filteredConsignments = consignments.filter(consignment => 
        consignment.takenDate >= start && consignment.takenDate <= end
      );
      
      // Calculate metrics
      const totalConsigned = filteredConsignments.reduce((total, c) => total + c.totalItems, 0);
      const totalValue = filteredConsignments.reduce((total, c) => total + c.totalValue, 0);
      const pendingPayment = filteredConsignments
        .filter(c => c.status === "aktif" || c.status === "sebagian")
        .reduce((total, c) => total + (c.totalValue - c.paidAmount), 0);
      
      // Active resellers
      const resellerIds = new Set(filteredConsignments.map(c => c.resellerId));
      
      // Format data for charts
      const statusData: Record<string, number> = {
        aktif: 0,
        lunas: 0,
        sebagian: 0,
        return: 0
      };
      
      filteredConsignments.forEach(c => {
        statusData[c.status] = (statusData[c.status] || 0) + c.totalItems;
      });
      
      return {
        totalConsigned,
        totalValue,
        totalResellers: resellerIds.size,
        pendingPayment,
        percentChange: 8.5, // Placeholder
        items: filteredConsignments,
        chartData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
        productData: [] // Can add product breakdown if needed
      };
    }
    
    return {};
  }
  
  // Helper for generating time series data for reports
  private getTimeSeriesData(sales: Sale[], start: Date, end: Date): any[] {
    // Calculate the date range difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      // Daily data
      const result: any[] = [];
      const current = new Date(start);
      
      while (current <= end) {
        const date = current.toISOString().split('T')[0];
        const dayTotal = sales
          .filter(sale => {
            const saleDate = sale.saleDate.toISOString().split('T')[0];
            return saleDate === date;
          })
          .reduce((total, sale) => total + sale.amount, 0);
        
        result.push({
          name: date.slice(5), // MM-DD format
          value: dayTotal
        });
        
        current.setDate(current.getDate() + 1);
      }
      
      return result;
    } else {
      // Monthly data
      const monthlyData: Record<string, number> = {};
      
      sales.forEach(sale => {
        const month = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[month] = (monthlyData[month] || 0) + sale.amount;
      });
      
      return Object.entries(monthlyData).map(([month, value]) => ({
        name: month.slice(5), // MM format
        value
      }));
    }
  }
  
  // Helper for calculating sales by product type
  private async getSalesByProductType(sales: Sale[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    
    // Initialize with all shirt types
    shirtTypes.forEach(type => {
      result[type] = 0;
    });
    
    // Process each sale
    for (const sale of sales) {
      if (!sale.consignmentId) {
        // For direct sales, we can track product types directly
        if (sale.items) {
          for (const item of sale.items) {
            const product = await this.getProduct(item.productId);
            if (product) {
              result[product.type] = (result[product.type] || 0) + (item.quantity * item.pricePerItem);
            }
          }
        }
      } else {
        // For consignment sales, distribute proportionally
        const consignment = await this.getConsignment(sale.consignmentId);
        if (consignment && consignment.items) {
          const totalValue = consignment.totalValue;
          const ratio = sale.amount / totalValue;
          
          for (const item of consignment.items) {
            if (item.product) {
              const itemValue = item.quantity * item.pricePerItem * ratio;
              result[item.product.type] = (result[item.product.type] || 0) + itemValue;
            }
          }
        }
      }
    }
    
    return result;
  }
  
  // Settings operations
  async getSettings(): Promise<any> {
    return this.settings;
  }
  
  async updateSettings(newSettings: any): Promise<any> {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }
  
  // Helper to create initial sample data
  private async initSampleData() {
    // Create sample products
    const productData: InsertProduct[] = [
      { productCode: "KD-001", type: "Kaos Dewasa", size: "M", stock: 85, price: 95000, notes: "Hitam polos" },
      { productCode: "KD-002", type: "Kaos Dewasa", size: "L", stock: 72, price: 95000, notes: "Hitam polos" },
      { productCode: "KD-003", type: "Kaos Dewasa", size: "XL", stock: 124, price: 100000, notes: "Hitam polos" },
      { productCode: "KDP-001", type: "Kaos Dewasa Panjang", size: "L", stock: 18, price: 115000, notes: "Hitam polos" },
      { productCode: "KDP-002", type: "Kaos Dewasa Panjang", size: "XL", stock: 32, price: 120000, notes: "Hitam polos" },
      { productCode: "KB-001", type: "Kaos Bloombee", size: "3XL", stock: 8, price: 140000, notes: "Premium" },
      { productCode: "KA-001", type: "Kaos Anak", size: "M", stock: 75, price: 75000, notes: "Biru polos" },
      { productCode: "KAT-001", type: "Kaos Anak Tanggung", size: "L", stock: 42, price: 85000, notes: "Merah polos" }
    ];
    
    for (const product of productData) {
      await this.createProduct(product);
    }
    
    // Create sample resellers
    const resellerData: InsertReseller[] = [
      { name: "Budi Santoso", phone: "0812-3456-7890", address: "Jl. Merdeka No. 123, Jakarta" },
      { name: "Dewi Lestari", phone: "0856-7890-1234", address: "Jl. Pahlawan No. 45, Bandung" }
    ];
    
    const resellers: Reseller[] = [];
    for (const reseller of resellerData) {
      resellers.push(await this.createReseller(reseller));
    }
    
    // Create sample consignments
    if (resellers.length > 0) {
      // Consignment for Budi
      const consignment1 = await this.createConsignment({
        consignmentCode: "CN-1001",
        resellerId: resellers[0].id,
        totalItems: 25,
        totalValue: 2750000,
        notes: "Konsinyasi pertama"
      });
      
      // Add consignment items
      await this.createConsignmentItem({
        consignmentId: consignment1.id,
        productId: 3, // Kaos Dewasa XL
        quantity: 15,
        pricePerItem: 110000
      });
      
      await this.createConsignmentItem({
        consignmentId: consignment1.id,
        productId: 2, // Kaos Dewasa L
        quantity: 10,
        pricePerItem: 105000
      });
      
      // Consignment for Dewi
      const consignment2 = await this.createConsignment({
        consignmentCode: "CN-1002",
        resellerId: resellers[1].id,
        totalItems: 15,
        totalValue: 1425000,
        notes: "Konsinyasi anak"
      });
      
      // Add consignment items
      await this.createConsignmentItem({
        consignmentId: consignment2.id,
        productId: 7, // Kaos Anak M
        quantity: 15,
        pricePerItem: 95000
      });
      
      // Update the consignment status to sebagian (partial payment)
      await this.updateConsignment(consignment2.id, {
        paidAmount: 800000,
        status: "sebagian"
      });
      
      // Create sample sales
      await this.createSale({
        saleCode: "SL-1001",
        amount: 950000,
        notes: "Penjualan langsung"
      });
      
      await this.createSale({
        saleCode: "SL-1002",
        consignmentId: consignment1.id,
        amount: 550000,
        notes: "Penjualan dari konsinyasi Budi"
      });
    }
  }
}

export const storage = new MemStorage();
