import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertResellerSchema, insertConsignmentSchema, insertSaleSchema, insertActivitySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler helper
  const handleError = (res: any, error: any) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    console.error("API Error:", error);
    return res.status(500).json({ message: error.message || "Terjadi kesalahan server" });
  };

  /**
   * Product Routes
   */
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      return res.json(products);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get low stock products
  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 30;
      const products = await storage.getLowStockProducts(threshold);
      return res.json(products);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produk tidak ditemukan" });
      }
      return res.json(product);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Create product
  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      return res.status(201).json(product);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Update product
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      return res.json(product);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Produk tidak ditemukan" });
      }
      return res.json({ success: true });
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Reseller Routes
   */
  // Get all resellers
  app.get("/api/resellers", async (req, res) => {
    try {
      const resellers = await storage.getResellers();
      return res.json(resellers);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get reseller by ID
  app.get("/api/resellers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reseller = await storage.getReseller(id);
      if (!reseller) {
        return res.status(404).json({ message: "Reseller tidak ditemukan" });
      }
      return res.json(reseller);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Create reseller
  app.post("/api/resellers", async (req, res) => {
    try {
      const validatedData = insertResellerSchema.parse(req.body);
      const reseller = await storage.createReseller(validatedData);
      return res.status(201).json(reseller);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Update reseller
  app.patch("/api/resellers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reseller = await storage.updateReseller(id, req.body);
      return res.json(reseller);
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Consignment Routes
   */
  // Get all consignments
  app.get("/api/consignments", async (req, res) => {
    try {
      const consignments = await storage.getConsignments();
      return res.json(consignments);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get active consignments
  app.get("/api/consignments/active", async (req, res) => {
    try {
      const consignments = await storage.getActiveConsignments();
      return res.json(consignments);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get consignment by ID
  app.get("/api/consignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const consignment = await storage.getConsignment(id);
      if (!consignment) {
        return res.status(404).json({ message: "Konsinyasi tidak ditemukan" });
      }
      return res.json(consignment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Create consignment
  app.post("/api/consignments", async (req, res) => {
    try {
      // Extract items before validation
      const { items, ...consignmentData } = req.body;
      const validatedConsignment = insertConsignmentSchema.parse(consignmentData);
      
      // Create the consignment
      const consignment = await storage.createConsignment(validatedConsignment);
      
      // Create consignment items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createConsignmentItem({
            consignmentId: consignment.id,
            productId: item.productId,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem
          });
        }
        
        // Hitung ulang total item dan nilai
        let totalItems = 0;
        let totalValue = 0;
        
        for (const item of items) {
          totalItems += item.quantity;
          totalValue += item.quantity * item.pricePerItem;
        }
        
        // Update konsinyasi dengan nilai total yang dihitung
        await storage.updateConsignment(consignment.id, {
          totalItems,
          totalValue
        });
      }
      
      // Get the complete consignment with items
      const completeConsignment = await storage.getConsignment(consignment.id);
      return res.status(201).json(completeConsignment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Process payment for a consignment
  app.post("/api/consignments/:id/payment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount, notes } = req.body;
      
      // Validate the amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Jumlah pembayaran harus positif" });
      }
      
      // Get the consignment
      const consignment = await storage.getConsignment(id);
      if (!consignment) {
        return res.status(404).json({ message: "Konsinyasi tidak ditemukan" });
      }
      
      // Calculate new paid amount
      const newPaidAmount = consignment.paidAmount + amount;
      let newStatus = consignment.status;
      
      // Update status based on payment
      if (newPaidAmount >= consignment.totalValue) {
        newStatus = "lunas";
      } else if (newPaidAmount > 0) {
        newStatus = "sebagian";
      }
      
      // Update the consignment
      const updatedConsignment = await storage.updateConsignment(id, {
        paidAmount: newPaidAmount,
        status: newStatus
      });
      
      // Create activity record
      await storage.createActivity({
        activityType: "penjualan",
        description: `Pembayaran konsinyasi: ${consignment.reseller?.name} (${amount})`,
        relatedId: id
      });
      
      return res.json(updatedConsignment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Process return for a consignment
  app.post("/api/consignments/:id/return", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { items, notes } = req.body;
      
      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Daftar produk yang dikembalikan diperlukan" });
      }
      
      // Get the consignment
      const consignment = await storage.getConsignment(id);
      if (!consignment) {
        return res.status(404).json({ message: "Konsinyasi tidak ditemukan" });
      }
      
      // Process each return item
      for (const returnItem of items) {
        const { productId, returnQuantity } = returnItem;
        
        // Find the consignment item
        const consignmentItems = await storage.getConsignmentItems(id);
        const item = consignmentItems.find(item => item.productId === productId);
        
        if (!item) {
          return res.status(400).json({ 
            message: `Produk dengan ID ${productId} tidak ada dalam konsinyasi ini` 
          });
        }
        
        // Validate return quantity
        const availableQuantity = item.quantity - item.returnedQuantity;
        if (returnQuantity > availableQuantity) {
          return res.status(400).json({
            message: `Jumlah pengembalian melebihi jumlah tersedia (${availableQuantity})`
          });
        }
        
        // Update the consignment item
        await storage.updateConsignmentItem(item.id, {
          returnedQuantity: item.returnedQuantity + returnQuantity
        });
      }
      
      // Update consignment status if all items are returned
      const updatedItems = await storage.getConsignmentItems(id);
      const allReturned = updatedItems.every(item => item.returnedQuantity === item.quantity);
      
      if (allReturned) {
        await storage.updateConsignment(id, { status: "return" });
      }
      
      // Create activity record
      const totalReturned = items.reduce((sum, item) => sum + item.returnQuantity, 0);
      await storage.createActivity({
        activityType: "return",
        description: `Pengembalian konsinyasi: ${consignment.reseller?.name} (${totalReturned} pcs)`,
        relatedId: id
      });
      
      // Get updated consignment
      const updatedConsignment = await storage.getConsignment(id);
      return res.json(updatedConsignment);
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Sales Routes
   */
  // Get all sales
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      return res.json(sales);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get sale by ID
  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Penjualan tidak ditemukan" });
      }
      return res.json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Create direct sale
  app.post("/api/sales/direct", async (req, res) => {
    try {
      const { items, saleCode, notes } = req.body;
      
      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Daftar produk yang dijual diperlukan" });
      }
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.pricePerItem;
        
        // Reduce product stock
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Produk dengan ID ${item.productId} tidak ditemukan` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Stok tidak cukup untuk ${product.type} ${product.size} (tersedia: ${product.stock})` 
          });
        }
        
        // Update product stock
        await storage.updateProduct(product.id, { stock: product.stock - item.quantity });
      }
      
      // Create the sale
      const sale = await storage.createSale({
        saleCode,
        amount: totalAmount,
        notes
      });
      
      return res.status(201).json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Create consignment sale
  app.post("/api/sales/consignment", async (req, res) => {
    try {
      const { consignmentId, amount, saleCode, notes } = req.body;
      
      // Validate data
      if (!consignmentId) {
        return res.status(400).json({ message: "ID konsinyasi diperlukan" });
      }
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Jumlah penjualan harus positif" });
      }
      
      // Get the consignment
      const consignment = await storage.getConsignment(consignmentId);
      if (!consignment) {
        return res.status(404).json({ message: "Konsinyasi tidak ditemukan" });
      }
      
      // Create the sale
      const sale = await storage.createSale({
        saleCode,
        consignmentId,
        amount,
        notes
      });
      
      return res.status(201).json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Delete sale
  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSale(id);
      if (!success) {
        return res.status(404).json({ message: "Penjualan tidak ditemukan" });
      }
      return res.json({ success: true });
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Activity Routes
   */
  // Get recent activities
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      return res.json(activities);
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Statistics Routes
   */
  // Get product statistics
  app.get("/api/stats/products", async (req, res) => {
    try {
      const stats = await storage.getProductStats();
      return res.json(stats);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get consignment statistics
  app.get("/api/stats/consignments", async (req, res) => {
    try {
      const stats = await storage.getConsignmentStats();
      return res.json(stats);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Get sales statistics
  app.get("/api/stats/sales", async (req, res) => {
    try {
      const stats = await storage.getSalesStats();
      return res.json(stats);
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Report Routes
   */
  // Get report data
  app.get("/api/reports", async (req, res) => {
    try {
      const { type, startDate, endDate } = req.query;
      
      if (!type || !startDate || !endDate) {
        return res.status(400).json({ 
          message: "Parameter 'type', 'startDate', dan 'endDate' diperlukan" 
        });
      }
      
      const reportData = await storage.getReportData(
        type as string,
        startDate as string,
        endDate as string
      );
      
      return res.json(reportData);
    } catch (error) {
      return handleError(res, error);
    }
  });

  /**
   * Settings Routes
   */
  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      return res.json(settings);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Update user settings
  app.patch("/api/settings/user", async (req, res) => {
    try {
      const { username, currentPassword, newPassword } = req.body;
      
      // Validate current password
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== currentPassword) {
        return res.status(401).json({ message: "Password saat ini tidak valid" });
      }
      
      // Update password if provided
      const updatedSettings: any = { username };
      if (newPassword) {
        updatedSettings.password = newPassword;
      }
      
      const settings = await storage.updateSettings(updatedSettings);
      return res.json(settings);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Update notification settings
  app.patch("/api/settings/notifications", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      return res.json(settings);
    } catch (error) {
      return handleError(res, error);
    }
  });

  // Update business settings
  app.patch("/api/settings/business", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      return res.json(settings);
    } catch (error) {
      return handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
