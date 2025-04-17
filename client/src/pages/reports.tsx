import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileDown,
  Printer,
  BarChart4,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Calendar,
} from "lucide-react";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils";

const Reports = () => {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeChartTab, setActiveChartTab] = useState("bar");
  
  // Initialize date range on component mount
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(firstDay.toISOString().split('T')[0]);
  }, []);
  
  // Update date range when selection changes
  useEffect(() => {
    const today = new Date();
    let start = new Date();
    
    switch (dateRange) {
      case "today":
        start = new Date(today);
        break;
      case "week":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "quarter":
        start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case "custom":
        // Don't change dates for custom range
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [dateRange]);
  
  // Query to get report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType, startDate, endDate],
    enabled: !!startDate && !!endDate,
    queryFn: async () => {
      // Memastikan semua parameter dikirim ke endpoint
      const url = `/api/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Gagal mengambil data laporan');
      }
      return response.json();
    }
  });
  
  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];
  
  // Transform data for charts if data exists
  const salesChartData = Array.isArray(reportData?.chartData) ? reportData.chartData : [];
  const productChartData = Array.isArray(reportData?.productData) ? reportData.productData : [];
  
  // Get total from report data
  const getTotal = () => {
    if (!reportData) return 0;
    
    switch (reportType) {
      case "sales":
        return reportData.totalSales || 0;
      case "inventory":
        return reportData.totalStock || 0;
      case "consignment":
        return reportData.totalConsigned || 0;
      default:
        return 0;
    }
  };
  
  // Format title based on report type
  const getReportTitle = () => {
    switch (reportType) {
      case "sales":
        return "Laporan Penjualan";
      case "inventory":
        return "Laporan Inventori";
      case "consignment":
        return "Laporan Konsinyasi";
      default:
        return "Laporan";
    }
  };
  
  // Format total label based on report type
  const getTotalLabel = () => {
    switch (reportType) {
      case "sales":
        return "Total Penjualan:";
      case "inventory":
        return "Total Stok:";
      case "consignment":
        return "Total Konsinyasi:";
      default:
        return "Total:";
    }
  };
  
  // Format total value based on report type
  const formatTotal = (value: number) => {
    switch (reportType) {
      case "sales":
        return formatCurrency(value);
      default:
        return formatNumber(value);
    }
  };
  
  // Export report function (placeholder)
  const exportReport = (format: "pdf" | "excel") => {
    alert(`Ekspor laporan dalam format ${format} akan diimplementasikan.`);
  };
  
  // Print report function (placeholder)
  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{getReportTitle()}</h1>
          <p className="text-neutral-500">Analisis dan laporan bisnis kaos Anda</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={() => exportReport("excel")}>
            <FileDown className="h-4 w-4 mr-2" />
            Ekspor Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport("pdf")}>
            <FileDown className="h-4 w-4 mr-2" />
            Ekspor PDF
          </Button>
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
      </header>
      
      {/* Report Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="reportType">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Pilih Jenis Laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Laporan Penjualan</SelectItem>
                  <SelectItem value="inventory">Laporan Inventori</SelectItem>
                  <SelectItem value="consignment">Laporan Konsinyasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateRange">Periode</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="quarter">Kuartal Ini</SelectItem>
                  <SelectItem value="year">Tahun Ini</SelectItem>
                  <SelectItem value="custom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={dateRange !== "custom"}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={dateRange !== "custom"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Summary and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-neutral-500">Memuat data...</p>
            ) : !reportData ? (
              <p className="text-neutral-500">Tidak ada data untuk periode ini</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{getTotalLabel()}</span>
                    <span className="font-bold">{formatTotal(getTotal())}</span>
                  </div>
                  
                  {reportType === "sales" && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Transaksi:</span>
                        <span>{formatNumber(reportData.totalTransactions || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Rata-rata per Transaksi:</span>
                        <span>{formatCurrency(reportData.averageTransaction || 0)}</span>
                      </div>
                    </>
                  )}
                  
                  {reportType === "inventory" && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Jumlah Produk:</span>
                        <span>{formatNumber(reportData.totalProducts || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Stok Rendah:</span>
                        <span>{formatNumber(reportData.lowStockCount || 0)}</span>
                      </div>
                    </>
                  )}
                  
                  {reportType === "consignment" && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Jumlah Reseller:</span>
                        <span>{formatNumber(reportData.totalResellers || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Belum Dibayar:</span>
                        <span>{formatCurrency(reportData.pendingPayment || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Additional summary information */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Perbandingan dengan periode sebelumnya</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Perubahan:</span>
                      <span className={`text-sm ${(reportData.percentChange || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {(reportData.percentChange || 0) >= 0 ? '+' : ''}{reportData.percentChange || 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Small pie chart for product/category distribution */}
                {reportType === "sales" && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Penjualan per Jenis Kaos</h3>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={productChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {productChartData.map((entry: { name: string, value: number }, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => reportType === "sales" ? formatCurrency(value as number) : formatNumber(value as number)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Charts */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Grafik</CardTitle>
              <div className="w-auto">
                <TabsList>
                  <TabsTrigger value="bar" onClick={() => setActiveChartTab("bar")} className="px-2 py-1">
                    <BarChart4 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="line" onClick={() => setActiveChartTab("line")} className="px-2 py-1">
                    <LineChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="pie" onClick={() => setActiveChartTab("pie")} className="px-2 py-1">
                    <PieChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-neutral-500">Memuat data grafik...</p>
              </div>
            ) : !reportData || salesChartData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-neutral-500">Tidak ada data untuk ditampilkan</p>
              </div>
            ) : (
              <Tabs value={activeChartTab} className="h-64">
                <TabsContent value="bar" className="mt-0 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesChartData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => reportType === "sales" ? formatCurrency(value as number) : formatNumber(value as number)}
                      />
                      <Legend />
                      <Bar dataKey="value" name={reportType === "sales" ? "Penjualan" : reportType === "inventory" ? "Stok" : "Konsinyasi"} fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="line" className="mt-0 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesChartData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => reportType === "sales" ? formatCurrency(value as number) : formatNumber(value as number)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={reportType === "sales" ? "Penjualan" : reportType === "inventory" ? "Stok" : "Konsinyasi"} 
                        stroke="#3B82F6" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="pie" className="mt-0 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {productChartData.map((entry: { name: string, value: number }, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => reportType === "sales" ? formatCurrency(value as number) : formatNumber(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {reportType === "sales" && (
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kode Penjualan</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Jumlah</TableHead>
                  </TableRow>
                )}
                
                {reportType === "inventory" && (
                  <TableRow>
                    <TableHead>Kode Produk</TableHead>
                    <TableHead>Jenis Kaos</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Konsinyasi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                )}
                
                {reportType === "consignment" && (
                  <TableRow>
                    <TableHead>Kode Konsinyasi</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Tanggal Ambil</TableHead>
                    <TableHead>Jumlah Produk</TableHead>
                    <TableHead>Nilai Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={reportType === "sales" ? 5 : reportType === "inventory" ? 6 : 6} className="text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : !reportData || !reportData.items || reportData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={reportType === "sales" ? 5 : reportType === "inventory" ? 6 : 6} className="text-center">
                      Tidak ada data untuk ditampilkan
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.items.map((item: any, index: number) => {
                    if (reportType === "sales") {
                      return (
                        <TableRow key={index}>
                          <TableCell>{formatDate(item.saleDate)}</TableCell>
                          <TableCell>{item.saleCode}</TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.consignmentId ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                              {item.consignmentId ? 'Konsinyasi' : 'Langsung'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.consignmentId 
                              ? item.resellerName
                              : item.productCount ? `${item.productCount} produk` : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      );
                    } else if (reportType === "inventory") {
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.productCode}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.size}</TableCell>
                          <TableCell>{formatNumber(item.stock)}</TableCell>
                          <TableCell>{formatNumber(item.consigned || 0)}</TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.stock > 30 
                                ? 'bg-success/10 text-success' 
                                : item.stock > 10 
                                ? 'bg-warning/10 text-warning' 
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {item.stock > 30 ? "Stok Baik" : item.stock > 10 ? "Stok Rendah" : "Perlu Restok"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    } else if (reportType === "consignment") {
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.consignmentCode}</TableCell>
                          <TableCell>{item.resellerName}</TableCell>
                          <TableCell>{formatDate(item.takenDate)}</TableCell>
                          <TableCell>{formatNumber(item.totalItems)}</TableCell>
                          <TableCell>{formatCurrency(item.totalValue)}</TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === "aktif" 
                                ? 'bg-success/10 text-success' 
                                : item.status === "lunas" 
                                ? 'bg-secondary/10 text-secondary' 
                                : item.status === "sebagian"
                                ? 'bg-warning/10 text-warning'
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {item.status === "aktif" 
                                ? "Aktif" 
                                : item.status === "lunas" 
                                ? "Lunas" 
                                : item.status === "sebagian"
                                ? "Sebagian"
                                : "Return"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
