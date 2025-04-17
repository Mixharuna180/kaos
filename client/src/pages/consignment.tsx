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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  RefreshCw,
  Edit,
  CalendarDays,
  Users,
  CircleCheck,
  CircleMinus,
  Trash,
  CalendarIcon,
  Loader2
} from "lucide-react";
import { cn, formatNumber, formatCurrency, formatDate, generateConsignmentCode } from "@/lib/utils";

// Form schema for reseller
const resellerFormSchema = z.object({
  name: z.string().min(1, { message: "Nama reseller harus diisi" }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Form schema for consignment
const consignmentFormSchema = z.object({
  resellerId: z.number().min(1, { message: "Reseller harus dipilih" }),
  items: z.array(
    z.object({
      productId: z.number().min(1, { message: "Produk harus dipilih" }),
      quantity: z.number().min(1, { message: "Jumlah harus minimal 1" }),
      pricePerItem: z.number().min(0, { message: "Harga tidak boleh negatif" }),
    })
  ).min(1, { message: "Minimal 1 produk harus dipilih" }),
  notes: z.string().optional(),
});

// Form schema for payment
const paymentFormSchema = z.object({
  amount: z.number().min(1, { message: "Jumlah pembayaran harus minimal 1" }),
  notes: z.string().optional(),
});

// Form schema for return
const returnFormSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().min(1, { message: "Produk harus dipilih" }),
      returnQuantity: z.number().min(1, { message: "Jumlah harus minimal 1" }),
    })
  ).min(1, { message: "Minimal 1 produk harus dipilih" }),
  notes: z.string().optional(),
});

// Form schema for edit
const editFormSchema = z.object({
  notes: z.string().optional(),
  totalItems: z.number().min(0, "Jumlah tidak boleh negatif"),
  totalValue: z.number().min(0, "Nilai total tidak boleh negatif"),
  takenDate: z.date(),
  status: z.enum(["aktif", "lunas", "sebagian", "return"]),
});

type ResellerFormValues = z.infer<typeof resellerFormSchema>;
type ConsignmentFormValues = z.infer<typeof consignmentFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;
type ReturnFormValues = z.infer<typeof returnFormSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

const Consignment = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isResellerDialogOpen, setIsResellerDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConsignment, setSelectedConsignment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReseller, setFilterReseller] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Queries
  const { data: consignments, isLoading: isLoadingConsignments } = useQuery({
    queryKey: ["/api/consignments"],
  });
  
  const { data: resellers, isLoading: isLoadingResellers } = useQuery({
    queryKey: ["/api/resellers"],
  });
  
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats/consignments"],
  });
  
  // Forms
  const resellerForm = useForm<ResellerFormValues>({
    resolver: zodResolver(resellerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });
  
  const consignmentForm = useForm<ConsignmentFormValues>({
    resolver: zodResolver(consignmentFormSchema),
    defaultValues: {
      resellerId: 0,
      items: [{ productId: 0, quantity: 1, pricePerItem: 0 }],
      notes: "",
    },
  });
  
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });
  
  const returnForm = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      items: [{ productId: 0, returnQuantity: 1 }],
      notes: "",
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      notes: "",
      totalItems: 0,
      totalValue: 0,
      takenDate: new Date(),
      status: "aktif",
    },
  });
  
  // Mutations
  const addResellerMutation = useMutation({
    mutationFn: (data: ResellerFormValues) => {
      return apiRequest("POST", "/api/resellers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({
        title: "Reseller berhasil ditambahkan",
        description: "Reseller baru telah ditambahkan ke sistem.",
      });
      setIsResellerDialogOpen(false);
      resellerForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan reseller",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addConsignmentMutation = useMutation({
    mutationFn: (data: ConsignmentFormValues) => {
      const consignmentCode = generateConsignmentCode();
      return apiRequest("POST", "/api/consignments", { ...data, consignmentCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/consignments"] });
      toast({
        title: "Konsinyasi berhasil ditambahkan",
        description: "Konsinyasi baru telah ditambahkan ke sistem.",
      });
      setIsAddDialogOpen(false);
      consignmentForm.reset({
        resellerId: 0,
        items: [{ productId: 0, quantity: 1, pricePerItem: 0 }],
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan konsinyasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const processPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormValues & { consignmentId: number }) => {
      const { consignmentId, ...rest } = data;
      return apiRequest("POST", `/api/consignments/${consignmentId}/payment`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/consignments"] });
      toast({
        title: "Pembayaran berhasil diproses",
        description: "Pembayaran telah dicatat dalam sistem.",
      });
      setIsPaymentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal memproses pembayaran",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const processReturnMutation = useMutation({
    mutationFn: (data: ReturnFormValues & { consignmentId: number }) => {
      const { consignmentId, ...rest } = data;
      return apiRequest("POST", `/api/consignments/${consignmentId}/return`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/consignments"] });
      toast({
        title: "Pengembalian berhasil diproses",
        description: "Pengembalian telah dicatat dalam sistem.",
      });
      setIsReturnDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal memproses pengembalian",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const editConsignmentMutation = useMutation({
    mutationFn: (data: EditFormValues & { consignmentId: number }) => {
      const { consignmentId, ...rest } = data;
      return apiRequest("PATCH", `/api/consignments/${consignmentId}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/consignments"] });
      toast({
        title: "Konsinyasi berhasil diperbarui",
        description: "Data konsinyasi telah diperbarui.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui konsinyasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form handlers
  const onAddResellerSubmit = (data: ResellerFormValues) => {
    addResellerMutation.mutate(data);
  };
  
  const onAddConsignmentSubmit = (data: ConsignmentFormValues) => {
    addConsignmentMutation.mutate(data);
  };
  
  const onPaymentSubmit = (data: PaymentFormValues) => {
    if (selectedConsignment) {
      processPaymentMutation.mutate({
        ...data,
        consignmentId: selectedConsignment.id,
      });
    }
  };
  
  const onReturnSubmit = (data: ReturnFormValues) => {
    if (selectedConsignment) {
      processReturnMutation.mutate({
        ...data,
        consignmentId: selectedConsignment.id,
      });
    }
  };
  
  const onEditSubmit = (data: EditFormValues) => {
    if (selectedConsignment) {
      editConsignmentMutation.mutate({
        ...data,
        consignmentId: selectedConsignment.id,
      });
    }
  };
  
  // Add product item to consignment form
  const addProductItem = () => {
    const currentItems = consignmentForm.getValues("items") || [];
    consignmentForm.setValue("items", [
      ...currentItems,
      { productId: 0, quantity: 1, pricePerItem: 0 },
    ]);
  };
  
  // Remove product item from consignment form
  const removeProductItem = (index: number) => {
    const currentItems = consignmentForm.getValues("items") || [];
    if (currentItems.length > 1) {
      consignmentForm.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };
  
  // Add return item to return form
  const addReturnItem = () => {
    const currentItems = returnForm.getValues("items") || [];
    returnForm.setValue("items", [
      ...currentItems,
      { productId: 0, returnQuantity: 1 },
    ]);
  };
  
  // Remove return item from return form
  const removeReturnItem = (index: number) => {
    const currentItems = returnForm.getValues("items") || [];
    if (currentItems.length > 1) {
      returnForm.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };
  
  // Handle payment button click
  const handlePaymentClick = (consignment: any) => {
    setSelectedConsignment(consignment);
    const remainingAmount = consignment.totalValue - consignment.paidAmount;
    paymentForm.reset({
      amount: remainingAmount,
      notes: "",
    });
    setIsPaymentDialogOpen(true);
  };
  
  // Handle edit button click
  const handleEditClick = (consignment: any) => {
    setSelectedConsignment(consignment);
    editForm.reset({
      notes: consignment.notes || "",
      totalItems: consignment.totalItems || 0,
      totalValue: consignment.totalValue || 0,
      takenDate: consignment.takenDate ? new Date(consignment.takenDate) : new Date(),
      status: consignment.status || "aktif",
    });
    setIsEditDialogOpen(true);
  };

  // Handle return button click
  const handleReturnClick = (consignment: any) => {
    setSelectedConsignment(consignment);
    // Set initial return items based on consignment items
    if (consignment.items && consignment.items.length > 0) {
      returnForm.reset({
        items: consignment.items.map((item: any) => ({
          productId: item.productId,
          returnQuantity: 1, // default to 1
        })),
        notes: "",
      });
    } else {
      returnForm.reset({
        items: [{ productId: 0, returnQuantity: 1 }],
        notes: "",
      });
    }
    setIsReturnDialogOpen(true);
  };
  
  // Filter consignments based on search term and filters
  const filteredConsignments = consignments
    ? consignments.filter((consignment: any) => {
        const matchesSearch = 
          consignment.consignmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (consignment.reseller && consignment.reseller.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesReseller = filterReseller === "all" || 
          (filterReseller && consignment.resellerId === parseInt(filterReseller));
        
        const matchesType = filterType === "all" || 
          (filterType && consignment.items && consignment.items.some((item: any) => 
            item.product && item.product.type === filterType
          ));
        
        const matchesStatus = filterStatus === "all" || 
          (filterStatus && consignment.status === filterStatus);
        
        return matchesSearch && matchesReseller && matchesType && matchesStatus;
      })
    : [];
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "aktif":
        return "bg-success/10 text-success";
      case "lunas":
        return "bg-secondary/10 text-secondary";
      case "sebagian":
        return "bg-warning/10 text-warning";
      case "return":
        return "bg-danger/10 text-danger";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };
  
  // Translate status for display
  const translateStatus = (status: string) => {
    switch (status) {
      case "aktif":
        return "Aktif";
      case "lunas":
        return "Lunas";
      case "sebagian":
        return "Sebagian";
      case "return":
        return "Return";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Manajemen Konsinyasi</h1>
          <p className="text-neutral-500">Kelola transaksi konsinyasi dengan reseller</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Tambah Konsinyasi
          </Button>
        </div>
      </header>
      
      {/* Consignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Total Produk Konsinyasi</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoadingStats ? "..." : formatNumber(stats?.totalConsigned || 0)}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Jumlah Reseller Aktif</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoadingStats ? "..." : formatNumber(stats?.activeResellers || 0)}
              </p>
            </div>
            <div className="p-2 bg-accent/10 rounded-full">
              <Users className="h-6 w-6 text-accent" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Pembayaran Menunggu</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoadingStats ? "..." : formatCurrency(stats?.pendingPayment || 0)}
              </p>
            </div>
            <div className="p-2 bg-warning/10 rounded-full">
              <CircleDollarSign className="h-6 w-6 text-warning" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="resellerFilter">Reseller</Label>
            <Select value={filterReseller} onValueChange={setFilterReseller}>
              <SelectTrigger id="resellerFilter">
                <SelectValue placeholder="Semua Reseller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Reseller</SelectItem>
                {resellers?.map((reseller: any) => (
                  <SelectItem key={reseller.id} value={reseller.id.toString()}>
                    {reseller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="jenisKonsinyasiFilter">Jenis Kaos</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="jenisKonsinyasiFilter">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {products?.map((product: any) => (
                  <SelectItem key={product.id} value={product.type}>
                    {product.type}
                  </SelectItem>
                )).filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.props.value === v.props.value) === i)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="statusKonsinyasiFilter">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="statusKonsinyasiFilter">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="sebagian">Sebagian</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="consignmentSearch">Cari</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                id="consignmentSearch"
                placeholder="Cari konsinyasi..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Consignment Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Reseller
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Produk
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Nilai Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Tgl Ambil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoadingConsignments ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-neutral-500">
                    Memuat data konsinyasi...
                  </td>
                </tr>
              ) : filteredConsignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-neutral-500">
                    Tidak ada konsinyasi yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredConsignments.map((consignment: any) => (
                  <tr key={consignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {consignment.consignmentCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-800">
                        {consignment.reseller?.name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {consignment.reseller?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {consignment.items?.map((item: any) => 
                          `${item.product?.type} (${item.product?.size})`
                        ).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatNumber(consignment.totalItems)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatCurrency(consignment.totalValue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatDate(consignment.takenDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(consignment.status)}`}>
                        {translateStatus(consignment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePaymentClick(consignment)}
                          title="Proses Pembayaran"
                          disabled={consignment.status === "lunas" || consignment.status === "return"}
                        >
                          <CircleDollarSign className="h-4 w-4 text-secondary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReturnClick(consignment)}
                          title="Proses Pengembalian"
                          disabled={consignment.status === "return"}
                        >
                          <RefreshCw className="h-4 w-4 text-warning" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(consignment)}
                          title="Edit Konsinyasi"
                        >
                          <Edit className="h-4 w-4 text-primary" />
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
      
      {/* Add Consignment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tambah Konsinyasi Baru</DialogTitle>
            <DialogDescription>
              Buat konsinyasi baru untuk reseller.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...consignmentForm}>
            <form onSubmit={consignmentForm.handleSubmit(onAddConsignmentSubmit)} className="space-y-4">
              <div className="flex items-center justify-between">
                <FormField
                  control={consignmentForm.control}
                  name="resellerId"
                  render={({ field }) => (
                    <FormItem className="flex-1 mr-2">
                      <FormLabel>Reseller</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={addConsignmentMutation.isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Reseller" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {resellers?.map((reseller: any) => (
                              <SelectItem key={reseller.id} value={reseller.id.toString()}>
                                {reseller.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsResellerDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Baru
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={consignmentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Catatan konsinyasi"
                          disabled={addConsignmentMutation.isPending}
                          rows={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Produk Konsinyasi</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProductItem}
                    disabled={addConsignmentMutation.isPending}
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
                    {consignmentForm.watch("items")?.map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormField
                            control={consignmentForm.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <Select
                                  value={field.value ? field.value.toString() : ""}
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  disabled={addConsignmentMutation.isPending}
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
                            control={consignmentForm.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormControl>
                                  <NumberInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    min={1}
                                    className="w-20"
                                    disabled={addConsignmentMutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={consignmentForm.control}
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
                                    disabled={addConsignmentMutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            (consignmentForm.watch(`items.${index}.quantity`) || 0) * 
                            (consignmentForm.watch(`items.${index}.pricePerItem`) || 0)
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductItem(index)}
                            disabled={consignmentForm.watch("items").length <= 1 || addConsignmentMutation.isPending}
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
                        {consignmentForm.watch("items")?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium mr-8">Total Nilai:</span>
                      <span>
                        {formatCurrency(
                          consignmentForm.watch("items")?.reduce(
                            (sum, item) => sum + ((item.quantity || 0) * (item.pricePerItem || 0)), 0
                          ) || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={addConsignmentMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={addConsignmentMutation.isPending}
                >
                  {addConsignmentMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Reseller Dialog */}
      <Dialog open={isResellerDialogOpen} onOpenChange={setIsResellerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Reseller Baru</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk menambahkan reseller baru.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resellerForm}>
            <form onSubmit={resellerForm.handleSubmit(onAddResellerSubmit)} className="space-y-4">
              <FormField
                control={resellerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Reseller</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={addResellerMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={resellerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={addResellerMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={resellerForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={addResellerMutation.isPending} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResellerDialogOpen(false)}
                  disabled={addResellerMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={addResellerMutation.isPending}
                >
                  {addResellerMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
            <DialogDescription>
              Catat pembayaran dari reseller untuk konsinyasi.
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsignment && (
            <div className="mb-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium">Kode Konsinyasi:</p>
                  <p>{selectedConsignment.consignmentCode}</p>
                </div>
                <div>
                  <p className="font-medium">Reseller:</p>
                  <p>{selectedConsignment.reseller?.name}</p>
                </div>
                <div>
                  <p className="font-medium">Total Nilai:</p>
                  <p>{formatCurrency(selectedConsignment.totalValue)}</p>
                </div>
                <div>
                  <p className="font-medium">Sudah Dibayar:</p>
                  <p>{formatCurrency(selectedConsignment.paidAmount)}</p>
                </div>
                <div>
                  <p className="font-medium">Sisa Pembayaran:</p>
                  <p className="text-warning font-medium">
                    {formatCurrency(selectedConsignment.totalValue - selectedConsignment.paidAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Pembayaran</FormLabel>
                    <FormControl>
                      <NumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={1}
                        max={selectedConsignment ? selectedConsignment.totalValue - selectedConsignment.paidAmount : undefined}
                        prefix="Rp "
                        disabled={processPaymentMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Catatan pembayaran" 
                        disabled={processPaymentMutation.isPending}
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
                  onClick={() => setIsPaymentDialogOpen(false)}
                  disabled={processPaymentMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={processPaymentMutation.isPending}
                >
                  {processPaymentMutation.isPending ? "Memproses..." : "Proses Pembayaran"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pengembalian</DialogTitle>
            <DialogDescription>
              Catat pengembalian produk dari reseller.
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsignment && (
            <div className="mb-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium">Kode Konsinyasi:</p>
                  <p>{selectedConsignment.consignmentCode}</p>
                </div>
                <div>
                  <p className="font-medium">Reseller:</p>
                  <p>{selectedConsignment.reseller?.name}</p>
                </div>
                <div>
                  <p className="font-medium">Total Item:</p>
                  <p>{formatNumber(selectedConsignment.totalItems)}</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <p className={`inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${getStatusBadgeClass(selectedConsignment.status)}`}>
                    {translateStatus(selectedConsignment.status)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Form {...returnForm}>
            <form onSubmit={returnForm.handleSubmit(onReturnSubmit)} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Produk yang Dikembalikan</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReturnItem}
                    disabled={processReturnMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah Kembali</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnForm.watch("items")?.map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormField
                            control={returnForm.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <Select
                                  value={field.value ? field.value.toString() : ""}
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  disabled={processReturnMutation.isPending}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Produk" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {selectedConsignment?.items?.map((item: any) => (
                                      <SelectItem key={item.productId} value={item.productId.toString()}>
                                        {`${item.product?.type} - ${item.product?.size} (${formatNumber(item.quantity - (item.returnedQuantity || 0))} tersisa)`}
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
                            control={returnForm.control}
                            name={`items.${index}.returnQuantity`}
                            render={({ field }) => (
                              <FormItem className="mb-0">
                                <FormControl>
                                  <NumberInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    min={1}
                                    className="w-20"
                                    disabled={processReturnMutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReturnItem(index)}
                            disabled={returnForm.watch("items").length <= 1 || processReturnMutation.isPending}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <FormField
                control={returnForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Catatan pengembalian" 
                        disabled={processReturnMutation.isPending}
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
                  onClick={() => setIsReturnDialogOpen(false)}
                  disabled={processReturnMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={processReturnMutation.isPending}
                >
                  {processReturnMutation.isPending ? "Memproses..." : "Proses Pengembalian"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Consignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Konsinyasi</DialogTitle>
            <DialogDescription>
              Edit informasi konsinyasi {selectedConsignment?.consignmentCode}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="totalItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Total</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Total</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="takenDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Ambil</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aktif">Aktif</SelectItem>
                          <SelectItem value="lunas">Lunas</SelectItem>
                          <SelectItem value="sebagian">Sebagian</SelectItem>
                          <SelectItem value="return">Return</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan tambahan untuk konsinyasi ini..."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={editConsignmentMutation.isPending}
                >
                  {editConsignmentMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Consignment;
