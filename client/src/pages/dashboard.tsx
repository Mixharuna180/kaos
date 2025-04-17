import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Box,
  Users,
  DollarSign,
  AlertTriangle,
  PlusCircle,
  Repeat,
  Trash,
  CircleDollarSign,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate, getStockStatus } from "@/lib/utils";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState("today");

  // Fetch products summary
  const { data: productStats, isLoading: loadingProductStats } = useQuery({
    queryKey: ["/api/stats/products"],
  });

  // Fetch consignment summary
  const { data: consignmentStats, isLoading: loadingConsignmentStats } = useQuery({
    queryKey: ["/api/stats/consignments"],
  });

  // Fetch sales summary
  const { data: salesStats, isLoading: loadingSalesStats } = useQuery({
    queryKey: ["/api/stats/sales"],
  });

  // Fetch low stock products
  const { data: lowStockProducts, isLoading: loadingLowStock } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  // Fetch recent activities
  const { data: recentActivities, isLoading: loadingActivities } = useQuery({
    queryKey: ["/api/activities/recent"],
  });

  // Fetch product stock
  const { data: productStock, isLoading: loadingProductStock } = useQuery({
    queryKey: ["/api/products"],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
          <p className="text-neutral-500">Ringkasan bisnis kaos Anda</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Select
            value={timeFilter}
            onValueChange={setTimeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-primary">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Total Stok Inventori</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {loadingProductStats ? "..." : formatNumber(productStats?.totalStock || 0)}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Box className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-success font-medium">+3.2%</span>
              <span className="text-neutral-500 ml-1">dari minggu lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-accent">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Total Konsinyasi</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {loadingConsignmentStats ? "..." : formatNumber(consignmentStats?.totalConsigned || 0)}
                </p>
              </div>
              <div className="p-2 bg-accent/10 rounded-full">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-success font-medium">+8.1%</span>
              <span className="text-neutral-500 ml-1">dari minggu lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-secondary">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Total Penjualan Bulan Ini</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {loadingSalesStats ? "..." : formatCurrency(salesStats?.monthlySales || 0)}
                </p>
              </div>
              <div className="p-2 bg-secondary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-success font-medium">+12.5%</span>
              <span className="text-neutral-500 ml-1">dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-warning">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Produk Perlu Restok</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {loadingLowStock ? "..." : lowStockProducts?.length || 0}
                </p>
              </div>
              <div className="p-2 bg-warning/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-danger font-medium">+2</span>
              <span className="text-neutral-500 ml-1">dari minggu lalu</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg text-neutral-800">
                Penjualan Produk (30 Hari Terakhir)
              </h2>
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  Harian
                </Button>
                <Button size="sm" variant="ghost" className="text-neutral-500">
                  Mingguan
                </Button>
                <Button size="sm" variant="ghost" className="text-neutral-500">
                  Bulanan
                </Button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-50 rounded flex items-center justify-center">
                {/* Will be implemented with Chart.js */}
                <p className="text-neutral-400 text-center">
                  Data penjualan akan ditampilkan dalam grafik
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-lg text-neutral-800 mb-4">
              Aktivitas Terbaru
            </h2>
            <div className="space-y-4">
              {loadingActivities ? (
                <p className="text-neutral-500">Memuat aktivitas...</p>
              ) : (
                recentActivities?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className={`p-2 ${getActivityIconBg(activity.activityType)} rounded-full`}>
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-800">
                        {activity.description}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {!loadingActivities && (!recentActivities || recentActivities.length === 0) && (
                <p className="text-neutral-500 text-sm">Belum ada aktivitas tercatat</p>
              )}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              Lihat Semua Aktivitas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Product Stock */}
      <Card>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-lg text-neutral-800">
            Stok Produk Terkini
          </h2>
          <Link href="/inventory">
            <a className="text-primary hover:text-primary-dark text-sm">
              Lihat Semua
            </a>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Jenis Kaos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Ukuran
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Stok
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Konsinyasi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loadingProductStock ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                    Memuat data produk...
                  </td>
                </tr>
              ) : (
                productStock?.slice(0, 5)?.map((product: any) => {
                  const { status, color } = getStockStatus(product.stock);
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-800">
                          {product.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">{product.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {formatNumber(product.stock)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {formatNumber(product.consigned || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${color}/10 text-${color}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loadingProductStock && (!productStock || productStock.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                    Belum ada data produk
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Helper to get activity icon based on activity type
function getActivityIcon(type: string) {
  switch (type) {
    case "stok":
      return <PlusCircle className="h-5 w-5 text-primary" />;
    case "konsinyasi":
      return <Users className="h-5 w-5 text-accent" />;
    case "penjualan":
      return <CircleDollarSign className="h-5 w-5 text-secondary" />;
    case "return":
      return <Repeat className="h-5 w-5 text-warning" />;
    case "hapus":
      return <Trash className="h-5 w-5 text-danger" />;
    default:
      return <Box className="h-5 w-5 text-primary" />;
  }
}

// Helper to get activity icon background based on activity type
function getActivityIconBg(type: string) {
  switch (type) {
    case "stok":
      return "bg-primary/10";
    case "konsinyasi":
      return "bg-accent/10";
    case "penjualan":
      return "bg-secondary/10";
    case "return":
      return "bg-warning/10";
    case "hapus":
      return "bg-danger/10";
    default:
      return "bg-primary/10";
  }
}

export default Dashboard;
