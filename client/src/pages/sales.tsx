import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  CircleDollarSign,
  Calendar,
  FileText,
  Trash,
  ShoppingCart,
  FileDown,
  Layers,
  Users,
} from "lucide-react";
import { formatNumber, formatCurrency, formatDate, generateSaleCode } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for direct sales
const directSaleFormSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().min(1, { message: "Produk harus dipilih" }),
      quantity: z.number().min(1, { message: "Jumlah harus minimal 1" }),
      pricePerItem: z.number().min(0, { message: "Harga tidak boleh negatif" }),
    })
  ).min(1, { message: "Minimal 1 produk harus dipilih" }),
  notes: z.string().optional(),
});

// Form schema for consignment sale
const consignmentSaleFormSchema = z.object({
  consignmentId: z.number().min(1, { message: "Konsinyasi harus dipilih" }),
  items: z.array(
    z.object({
      productId: z.number().min(1, { message: "Produk harus dipilih" }),
      quantity: z.number().min(1, { message: "Jumlah harus minimal 1" }),
      pricePerItem: z.number().min(0, { message: "Harga tidak boleh negatif" }),
    })
  ).min(1, { message: "Minimal 1 produk harus dipilih" }),
  notes: z.string().optional(),
});

type DirectSaleFormValues = z.infer<typeof directSaleFormSchema>;
type ConsignmentSaleFormValues = z.infer<typeof consignmentSaleFormSchema>;

const Sales = () => {
  const { toast } = useToast();
  const [isDirectSaleDialogOpen, setIsDirectSaleDialogOpen] = useState(false);
  const [isConsignmentSaleDialogOpen, setIsConsignmentSaleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<number | null>(null);
  const [consignmentProducts, setConsignmentProducts] = useState<any[]>([]);
  
  // Queries
  const { data: sales, isLoading: isLoadingSales } = useQuery({
    queryKey: ["/api/sales"],
  });
  
  const { data: consignments, isLoading: isLoadingConsignments } = useQuery({
    queryKey: ["/api/consignments/active"],
  });
  
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats/sales"],
  });
  
  // Forms
  const directSaleForm = useForm<DirectSaleFormValues>({
    resolver: zodResolver(directSaleFormSchema),
    defaultValues: {
      items: [{ productId: 0, quantity: 1, pricePerItem: 0 }],
      notes: "",
    },
  });
  
  const consignmentSaleForm = useForm<ConsignmentSaleFormValues>({
    resolver: zodResolver(consignmentSaleFormSchema),
    defaultValues: {
      consignmentId: 0,
      items: [{ productId: 0, quantity: 1, pricePerItem: 0 }],
      notes: "",
    },
  });
  
  // Mutations
  const addDirectSaleMutation = useMutation({
    mutationFn: (data: DirectSaleFormValues) => {
      const saleCode = generateSaleCode();
      return apiRequest("POST", "/api/sales/direct", { ...data, saleCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Penjualan berhasil dicatat",
        description: "Penjualan langsung telah dicatat dalam sistem.",
      });
      setIsDirectSaleDialogOpen(false);
      directSaleForm.reset({
        items: [{ productId: 0, quantity: 1, pricePerItem: 0 }],
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal mencatat penjualan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addConsignmentSaleMutation = useMutation({
    mutationFn: (data: ConsignmentSaleFormValues) => {
      const saleCode = generateSaleCode();
      return apiRequest("POST", "/api/sales/consignment", { ...data, saleCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consignments/active"] });
      toast({
        title: "Penjualan konsinyasi berhasil dicatat",
        description: "Penjualan dari konsinyasi telah dicatat dalam sistem.",
      });
      setIsConsignmentSaleDialogOpen(false);
      consignmentSaleForm.reset({
        consignmentId: 0,
        amount: 0,
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal mencatat penjualan konsinyasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteSaleMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/sales/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/sales"] });
      toast({
        title: "Penjualan berhasil dihapus",
        description: "Data penjualan telah dihapus dari sistem.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus penjualan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form handlers
  const onDirectSaleSubmit = (data: DirectSaleFormValues) => {
    addDirectSaleMutation.mutate(data);
  };
  
  // Fungsi untuk memuat produk-produk konsinyasi
  const loadConsignmentProducts = (consignmentId: number) => {
    if (!consignments) return;
    setSelectedConsignmentId(consignmentId);
    
    // Cari konsinyasi yang dipilih
    const selectedConsignment = consignments.find((c: any) => c.id === consignmentId);
    if (!selectedConsignment || !selectedConsignment.items) {
      setConsignmentProducts([]);
      return;
    }
    
    // Siapkan produk-produk yang tersedia di konsinyasi ini
    const availableProducts = selectedConsignment.items
      .filter((item: any) => {
        // Filter yang quantitynya belum habis
        const availableQuantity = item.quantity - (item.returnedQuantity || 0);
        return availableQuantity > 0 && item.product;
      })
      .map((item: any) => ({
        id: item.productId,
        availableQuantity: item.quantity - (item.returnedQuantity || 0),
        product: item.product,
        pricePerItem: item.pricePerItem
      }));
    
    setConsignmentProducts(availableProducts);
    
    // Reset form dengan produk pertama yang tersedia (jika ada)
    if (availableProducts.length > 0) {
      consignmentSaleForm.reset({
        consignmentId,
        items: [{ 
          productId: availableProducts[0].id, 
          quantity: 1, 
          pricePerItem: availableProducts[0].pricePerItem 
        }],
        notes: ""
      });
    } else {
      consignmentSaleForm.reset({
        consignmentId,
        items: [{ productId: 0, quantity: 1, pricePerItem: 0 }],
        notes: ""
      });
    }
  };
  
  // Add consignment product item to form
  const addConsignmentProductItem = () => {
    const currentItems = consignmentSaleForm.getValues("items") || [];
    consignmentSaleForm.setValue("items", [
      ...currentItems,
      { productId: 0, quantity: 1, pricePerItem: 0 },
    ]);
  };
  
  // Remove consignment product item from form
  const removeConsignmentProductItem = (index: number) => {
    const currentItems = consignmentSaleForm.getValues("items") || [];
    if (currentItems.length > 1) {
      consignmentSaleForm.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };
  
  // Submit penjualan konsinyasi
  const onConsignmentSaleSubmit = (data: ConsignmentSaleFormValues) => {
    addConsignmentSaleMutation.mutate(data);
  };
  
  // Add product item to direct sale form
  const addProductItem = () => {
    const currentItems = directSaleForm.getValues("items") || [];
    directSaleForm.setValue("items", [
      ...currentItems,
      { productId: 0, quantity: 1, pricePerItem: 0 },
    ]);
  };
  
  // Remove product item from direct sale form
  const removeProductItem = (index: number) => {
    const currentItems = directSaleForm.getValues("items") || [];
    if (currentItems.length > 1) {
      directSaleForm.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };
  
  // Update price per item when product is selected
  const updatePricePerItem = (index: number, productId: number) => {
    if (productId && products) {
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        directSaleForm.setValue(`items.${index}.pricePerItem`, product.price);
      }
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = (sale: any) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle delete confirm
  const handleDelete = () => {
    if (selectedSale) {
      deleteSaleMutation.mutate(selectedSale.id);
    }
  };
  
  // Filter sales based on search term and filters
  const filteredSales = sales
    ? sales.filter((sale: any) => {
        const matchesSearch = 
          sale.saleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.consignment?.reseller?.name && sale.consignment.reseller.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const saleDate = new Date(sale.saleDate);
        const matchesDateFrom = !filterDateFrom || saleDate >= new Date(filterDateFrom);
        const matchesDateTo = !filterDateTo || saleDate <= new Date(filterDateTo + 'T23:59:59');
        
        const matchesType = filterType === "all" || 
          (filterType === "direct" && !sale.consignmentId) || 
          (filterType === "consignment" && sale.consignmentId);
        
        return matchesSearch && matchesDateFrom && matchesDateTo && matchesType;
      })
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Manajemen Penjualan</h1>
          <p className="text-neutral-500">Catat dan kelola semua transaksi penjualan</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={() => setIsConsignmentSaleDialogOpen(true)}>
            <Users className="h-5 w-5 mr-2" />
            Penjualan Konsinyasi
          </Button>
          <Button onClick={() => setIsDirectSaleDialogOpen(true)}>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Penjualan Langsung
          </Button>
        </div>
      </header>
      
      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Penjualan Hari Ini</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoadingStats ? "..." : formatCurrency(stats?.dailySales || 0)}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <CircleDollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Penjualan Bulan Ini</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoadingStats ? "..." : formatCurrency(stats?.monthlySales || 0)}
              </p>
            </div>
            <div className="p-2 bg-secondary/10 rounded-full">
              <Calendar className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Total Terjual</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoadingStats ? "..." : formatNumber(stats?.totalItemsSold || 0)}
              </p>
            </div>
            <div className="p-2 bg-accent/10 rounded-full">
              <Layers className="h-6 w-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="saleSearch">Cari</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                id="saleSearch"
                placeholder="Cari penjualan..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="filterDateFrom">Dari Tanggal</Label>
            <Input
              id="filterDateFrom"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="filterDateTo">Sampai Tanggal</Label>
            <Input
              id="filterDateTo"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="filterType">Jenis Penjualan</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="filterType">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="direct">Penjualan Langsung</SelectItem>
                <SelectItem value="consignment">Penjualan Konsinyasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" className="ml-2">
            <FileDown className="h-4 w-4 mr-1" />
            Ekspor Data
          </Button>
        </div>
      </Card>
      
      {/* Sales Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Detail
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Catatan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoadingSales ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                    Memuat data penjualan...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                    Tidak ada data penjualan yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {sale.saleCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatDate(sale.saleDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.consignmentId ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                        {sale.consignmentId ? 'Konsinyasi' : 'Langsung'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {sale.consignmentId 
                          ? `${sale.consignment?.reseller?.name} (${sale.consignment?.consignmentCode})`
                          : (sale.items ? `${sale.items.length} produk` : '-')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-800">
                        {formatCurrency(sale.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {sale.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Lihat Detail"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(sale)}
                          title="Hapus Penjualan"
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination can be added here in the future */}
      </Card>
      
      {/* Direct Sale Dialog */}
      <Dialog open={isDirectSaleDialogOpen} onOpenChange={setIsDirectSaleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tambah Penjualan Langsung</DialogTitle>
            <DialogDescription>
              Catat penjualan langsung dari stok inventori.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...directSaleForm}>
            <form onSubmit={directSaleForm.handleSubmit(onDirectSaleSubmit)} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Produk yang Dijual</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProductItem}
                    disabled={addDirectSaleMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Produk
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Harga/Item</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directSaleForm.watch("items")?.map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormField
                            control={directSaleForm.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <Select
                                  value={field.value ? field.value.toString() : ""}
                                  onValueChange={(value) => {
                                    const productId = parseInt(value);
                                    field.onChange(productId);
                                    updatePricePerItem(index, productId);
                                  }}
                                  disabled={addDirectSaleMutation.isPending}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Produk" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products?.map((product: any) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {`${product.type} - ${product.size} (${formatNumber(product.stock)} tersedia)`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={directSaleForm.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormControl>
                                  <NumberInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    min={1}
                                    className="w-20"
                                    disabled={addDirectSaleMutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={directSaleForm.control}
                            name={`items.${index}.pricePerItem`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormControl>
                                  <NumberInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    min={0}
                                    prefix="Rp "
                                    className="w-32"
                                    disabled={addDirectSaleMutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            (directSaleForm.watch(`items.${index}.quantity`) || 0) * 
                            (directSaleForm.watch(`items.${index}.pricePerItem`) || 0)
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductItem(index)}
                            disabled={directSaleForm.watch("items").length <= 1 || addDirectSaleMutation.isPending}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-end mt-4">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium mr-8">Total Item:</span>
                      <span>
                        {directSaleForm.watch("items")?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium mr-8">Total Nilai:</span>
                      <span className="font-bold">
                        {formatCurrency(
                          directSaleForm.watch("items")?.reduce(
                            (sum, item) => sum + ((item.quantity || 0) * (item.pricePerItem || 0)), 0
                          ) || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <FormField
                control={directSaleForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Catatan penjualan" 
                        disabled={addDirectSaleMutation.isPending}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDirectSaleDialogOpen(false)}
                  disabled={addDirectSaleMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={addDirectSaleMutation.isPending}
                >
                  {addDirectSaleMutation.isPending ? "Menyimpan..." : "Simpan Penjualan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Consignment Sale Dialog */}
      <Dialog open={isConsignmentSaleDialogOpen} onOpenChange={setIsConsignmentSaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Penjualan Konsinyasi</DialogTitle>
            <DialogDescription>
              Catat penjualan yang dilakukan oleh reseller konsinyasi.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...consignmentSaleForm}>
            <form onSubmit={consignmentSaleForm.handleSubmit(onConsignmentSaleSubmit)} className="space-y-4">
              <FormField
                control={consignmentSaleForm.control}
                name="consignmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Konsinyasi</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) => {
                        const consignmentId = parseInt(value);
                        field.onChange(consignmentId);
                        loadConsignmentProducts(consignmentId);
                      }}
                      disabled={addConsignmentSaleMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Konsinyasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {consignments?.map((consignment: any) => (
                          <SelectItem key={consignment.id} value={consignment.id.toString()}>
                            {`${consignment.consignmentCode} - ${consignment.reseller?.name} (Rp ${formatNumber(consignment.totalValue - consignment.paidAmount)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={consignmentSaleForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Penjualan</FormLabel>
                    <FormControl>
                      <NumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={1}
                        prefix="Rp "
                        disabled={addConsignmentSaleMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={consignmentSaleForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Catatan penjualan" 
                        disabled={addConsignmentSaleMutation.isPending}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConsignmentSaleDialogOpen(false)}
                  disabled={addConsignmentSaleMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={addConsignmentSaleMutation.isPending}
                >
                  {addConsignmentSaleMutation.isPending ? "Menyimpan..." : "Simpan Penjualan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus data penjualan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSaleMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSaleMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSaleMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sales;
