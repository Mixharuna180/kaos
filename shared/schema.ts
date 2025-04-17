import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// T-shirt types
export const shirtTypes = [
  "Kaos Dewasa",
  "Kaos Dewasa Panjang",
  "Kaos Bloombee",
  "Kaos Anak",
  "Kaos Anak Tanggung"
] as const;

// T-shirt sizes
export const shirtSizes = [
  "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL", "7XL", "8XL"
] as const;

// Products schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: text("product_code").notNull().unique(),
  type: text("type").notNull(),
  size: text("size").notNull(),
  stock: integer("stock").notNull().default(0),
  price: integer("price").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Resellers schema
export const resellers = pgTable("resellers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResellerSchema = createInsertSchema(resellers).omit({
  id: true,
  createdAt: true,
});

export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellers.$inferSelect;

// Consignment schema
export const consignments = pgTable("consignments", {
  id: serial("id").primaryKey(),
  consignmentCode: text("consignment_code").notNull().unique(),
  resellerId: integer("reseller_id").notNull(),
  totalItems: integer("total_items").notNull().default(0),
  totalValue: integer("total_value").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  status: text("status").notNull().default("aktif"), // aktif, lunas, sebagian, return
  takenDate: timestamp("taken_date").defaultNow(),
  returnDate: timestamp("return_date"),
  notes: text("notes"),
});

export const insertConsignmentSchema = createInsertSchema(consignments).omit({
  id: true,
  paidAmount: true,
  status: true,
  returnDate: true,
});

export type InsertConsignment = z.infer<typeof insertConsignmentSchema>;
export type Consignment = typeof consignments.$inferSelect;

// Consignment items schema
export const consignmentItems = pgTable("consignment_items", {
  id: serial("id").primaryKey(),
  consignmentId: integer("consignment_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  returnedQuantity: integer("returned_quantity").notNull().default(0),
  pricePerItem: integer("price_per_item").notNull().default(0),
});

export const insertConsignmentItemSchema = createInsertSchema(consignmentItems).omit({
  id: true,
  returnedQuantity: true,
});

export type InsertConsignmentItem = z.infer<typeof insertConsignmentItemSchema>;
export type ConsignmentItem = typeof consignmentItems.$inferSelect;

// Sales schema
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  saleCode: text("sale_code").notNull().unique(),
  consignmentId: integer("consignment_id"),  // null for direct sales
  amount: integer("amount").notNull().default(0),
  saleDate: timestamp("sale_date").defaultNow(),
  notes: text("notes"),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  saleDate: true,
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Activities schema for activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(), // stok, konsinyasi, penjualan, return
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  relatedId: integer("related_id"), // ID related to the specific entity
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
