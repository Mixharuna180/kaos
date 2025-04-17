import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  Database,
  Bell,
  Printer,
  HelpCircle,
  Save,
} from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";

// Form schema for user settings
const userSettingsSchema = z.object({
  username: z.string().min(3, { message: "Username minimal 3 karakter" }),
  currentPassword: z.string().min(1, { message: "Password saat ini diperlukan" }),
  newPassword: z.string().min(6, { message: "Password baru minimal 6 karakter" }).optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Password konfirmasi tidak sesuai",
  path: ["confirmPassword"],
});

// Form schema for notifications
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  lowStockAlerts: z.boolean(),
  reportSummary: z.boolean(),
  consignmentReminders: z.boolean(),
});

// Form schema for business settings
const businessSettingsSchema = z.object({
  businessName: z.string().min(1, { message: "Nama bisnis diperlukan" }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  lowStockThreshold: z.number().min(1, { message: "Nilai minimal 1" }),
  criticalStockThreshold: z.number().min(1, { message: "Nilai minimal 1" }),
});

type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;
type BusinessSettingsFormValues = z.infer<typeof businessSettingsSchema>;

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  // Queries
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
  });
  
  // Forms
  const userSettingsForm = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      username: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const notificationSettingsForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      lowStockAlerts: true,
      reportSummary: false,
      consignmentReminders: true,
    },
  });
  
  const businessSettingsForm = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      businessName: "",
      phoneNumber: "",
      address: "",
      lowStockThreshold: 30,
      criticalStockThreshold: 10,
    },
  });
  
  // Set form defaults when settings are loaded
  useState(() => {
    if (settings) {
      userSettingsForm.reset({
        username: settings.username || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      notificationSettingsForm.reset({
        emailNotifications: settings.emailNotifications || true,
        lowStockAlerts: settings.lowStockAlerts || true,
        reportSummary: settings.reportSummary || false,
        consignmentReminders: settings.consignmentReminders || true,
      });
      
      businessSettingsForm.reset({
        businessName: settings.businessName || "",
        phoneNumber: settings.phoneNumber || "",
        address: settings.address || "",
        lowStockThreshold: settings.lowStockThreshold || 30,
        criticalStockThreshold: settings.criticalStockThreshold || 10,
      });
    }
  }, [settings]);
  
  // Mutations
  const updateUserSettingsMutation = useMutation({
    mutationFn: (data: UserSettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Pengaturan user berhasil diperbarui",
        description: "Perubahan telah disimpan.",
      });
      userSettingsForm.reset({
        ...userSettingsForm.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui pengaturan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: (data: NotificationSettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings/notifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Pengaturan notifikasi berhasil diperbarui",
        description: "Perubahan telah disimpan.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui pengaturan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateBusinessSettingsMutation = useMutation({
    mutationFn: (data: BusinessSettingsFormValues) => {
      return apiRequest("PATCH", "/api/settings/business", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Pengaturan bisnis berhasil diperbarui",
        description: "Perubahan telah disimpan.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui pengaturan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form handlers
  const onUserSettingsSubmit = (data: UserSettingsFormValues) => {
    updateUserSettingsMutation.mutate(data);
  };
  
  const onNotificationSettingsSubmit = (data: NotificationSettingsFormValues) => {
    updateNotificationSettingsMutation.mutate(data);
  };
  
  const onBusinessSettingsSubmit = (data: BusinessSettingsFormValues) => {
    updateBusinessSettingsMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-800">Pengaturan</h1>
        <p className="text-neutral-500">Kelola pengaturan sistem manajemen inventori</p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Akun</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center">
            <SettingsIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Bisnis</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sistem</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Account Settings Tab */}
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Akun</CardTitle>
              <CardDescription>
                Perbarui informasi akun dan ubah password Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userSettingsForm}>
                <form onSubmit={userSettingsForm.handleSubmit(onUserSettingsSubmit)} className="space-y-4">
                  <FormField
                    control={userSettingsForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={updateUserSettingsMutation.isPending} />
                        </FormControl>
                        <FormDescription>
                          Nama yang akan digunakan untuk login ke sistem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-6" />
                  <h3 className="text-lg font-medium mb-4">Ubah Password</h3>
                  
                  <FormField
                    control={userSettingsForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Saat Ini</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            disabled={updateUserSettingsMutation.isPending} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userSettingsForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password Baru</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              disabled={updateUserSettingsMutation.isPending} 
                              placeholder="Kosongkan jika tidak ingin mengubah" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userSettingsForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Konfirmasi Password Baru</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              disabled={updateUserSettingsMutation.isPending} 
                              placeholder="Konfirmasi password baru" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateUserSettingsMutation.isPending}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateUserSettingsMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>
                Konfigurasi notifikasi dan pemberitahuan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationSettingsForm}>
                <form onSubmit={notificationSettingsForm.handleSubmit(onNotificationSettingsSubmit)} className="space-y-4">
                  <FormField
                    control={notificationSettingsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notifikasi Email</FormLabel>
                          <FormDescription>
                            Terima notifikasi melalui email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={updateNotificationSettingsMutation.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationSettingsForm.control}
                    name="lowStockAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Peringatan Stok Rendah</FormLabel>
                          <FormDescription>
                            Dapatkan peringatan saat stok produk rendah
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={updateNotificationSettingsMutation.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationSettingsForm.control}
                    name="reportSummary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ringkasan Laporan Mingguan</FormLabel>
                          <FormDescription>
                            Terima laporan ringkasan mingguan 
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={updateNotificationSettingsMutation.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationSettingsForm.control}
                    name="consignmentReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Pengingat Konsinyasi</FormLabel>
                          <FormDescription>
                            Pengingat untuk konsinyasi yang belum lunas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={updateNotificationSettingsMutation.isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateNotificationSettingsMutation.isPending}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateNotificationSettingsMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Business Settings Tab */}
        <TabsContent value="business" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Bisnis</CardTitle>
              <CardDescription>
                Konfigurasi informasi bisnis dan parameter sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...businessSettingsForm}>
                <form onSubmit={businessSettingsForm.handleSubmit(onBusinessSettingsSubmit)} className="space-y-4">
                  <FormField
                    control={businessSettingsForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Bisnis</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={updateBusinessSettingsMutation.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessSettingsForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={updateBusinessSettingsMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={businessSettingsForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alamat</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={updateBusinessSettingsMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-6" />
                  <h3 className="text-lg font-medium mb-4">Konfigurasi Stok</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessSettingsForm.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batas Stok Rendah</FormLabel>
                          <FormControl>
                            <NumberInput
                              value={field.value}
                              onChange={field.onChange}
                              min={1}
                              disabled={updateBusinessSettingsMutation.isPending}
                            />
                          </FormControl>
                          <FormDescription>
                            Produk akan ditandai "Stok Rendah" jika jumlah stok di bawah nilai ini
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={businessSettingsForm.control}
                      name="criticalStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batas Stok Kritis</FormLabel>
                          <FormControl>
                            <NumberInput
                              value={field.value}
                              onChange={field.onChange}
                              min={1}
                              disabled={updateBusinessSettingsMutation.isPending}
                            />
                          </FormControl>
                          <FormDescription>
                            Produk akan ditandai "Perlu Restok" jika jumlah stok di bawah nilai ini
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateBusinessSettingsMutation.isPending}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateBusinessSettingsMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Settings Tab */}
        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
              <CardDescription>
                Kelola pengaturan sistem dan operasi database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-medium">Cadangkan Database</h3>
                      <p className="text-sm text-neutral-500">
                        Buat cadangan dari seluruh data sistem
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Sekarang
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-medium">Pengaturan Cetak</h3>
                      <p className="text-sm text-neutral-500">
                        Konfigurasi format dan pengaturan printer
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center">
                      <Printer className="h-4 w-4 mr-2" />
                      Konfigurasi
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-medium">Bantuan & Dukungan</h3>
                      <p className="text-sm text-neutral-500">
                        Dapatkan bantuan menggunakan sistem
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Lihat Bantuan
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="rounded-md border p-4 bg-red-50">
                <h3 className="text-base font-medium text-red-800">Zona Berbahaya</h3>
                <p className="text-sm text-red-700 mt-1 mb-3">
                  Tindakan di bawah ini tidak dapat dibatalkan. Berhati-hatilah.
                </p>
                <Button variant="destructive">
                  Reset Seluruh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
