import { Product, Customer, Order, Transaction } from '@/types'

export const mockProducts: Product[] = [
  { id: '1', name: 'ভিটি বালু (Viti Balu)', type: 'vitiBalu', grade: 'type1', price: 1200, unit: 'CFT', stock: 5000 },
  { id: '2', name: 'গজারিয়া বালু (Gojariya Balu)', type: 'gojariyaBalu', grade: 'medium', price: 1000, unit: 'CFT', stock: 3000 },
  { id: '3', name: 'পাকশী বালু (Pakshi Balu)', type: 'pakshiBalu', grade: 'type1', price: 1500, unit: 'CFT', stock: 2000 },
  { id: '4', name: 'সিলেট বালু (Selet Balu)', type: 'seletBalu', grade: 'medium', price: 900, unit: 'CFT', stock: 4000 },
  { id: '5', name: 'পাথর (Stone)', type: 'pathor', price: 2000, unit: 'CFT', stock: 1500 },
  { id: '6', name: 'খোয়া (Khoya)', type: 'khoya', price: 800, unit: 'CFT', stock: 6000 },
  { id: '7', name: 'রড (Rod)', type: 'rod', price: 75000, unit: 'TON', stock: 50 },
  { id: '8', name: 'সিমেন্ট (Cement)', type: 'cement', price: 450, unit: 'BAG', stock: 1000 },
]

export const mockCustomers: Customer[] = [
  { id: '1', name: 'রহিম কন্সট্রাকশন', phone: '01712345678', address: 'মিরপুর, ঢাকা', totalOrders: 25, totalSpent: 1250000, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'করিম বিল্ডার্স', phone: '01823456789', address: 'উত্তরা, ঢাকা', totalOrders: 18, totalSpent: 980000, createdAt: new Date('2024-02-20') },
  { id: '3', name: 'আব্দুল হক এন্ড সন্স', phone: '01934567890', address: 'ধানমন্ডি, ঢাকা', totalOrders: 32, totalSpent: 1560000, createdAt: new Date('2024-01-10') },
  { id: '4', name: 'নিউ ঢাকা কন্সট্রাকশন', phone: '01645678901', address: 'গুলশান, ঢাকা', totalOrders: 15, totalSpent: 780000, createdAt: new Date('2024-03-05') },
  { id: '5', name: 'মডার্ন বিল্ডিং কর্পোরেশন', phone: '01756789012', address: 'বনানী, ঢাকা', totalOrders: 28, totalSpent: 2100000, createdAt: new Date('2024-01-25') },
]

export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerId: '1',
    customerName: 'রহিম কন্সট্রাকশন',
    items: [
      { productId: '1', productName: 'ভিটি বালু', quantity: 100, price: 1200, total: 120000 },
      { productId: '5', productName: 'পাথর', quantity: 50, price: 2000, total: 100000 },
    ],
    total: 220000,
    status: 'delivered',
    deliveryAddress: 'মিরপুর, ঢাকা',
    createdAt: new Date('2024-11-01'),
    deliveredAt: new Date('2024-11-02'),
    date: ''
  },
  {
    id: 'ORD002',
    customerId: '2',
    customerName: 'করিম বিল্ডার্স',
    items: [
      { productId: '2', productName: 'গজারিয়া বালু', quantity: 150, price: 1000, total: 150000 },
      { productId: '8', productName: 'সিমেন্ট', quantity: 200, price: 450, total: 90000 },
    ],
    total: 240000,
    status: 'processing',
    deliveryAddress: 'উত্তরা, ঢাকা',
    createdAt: new Date('2024-11-05'),
    date: ''
  },
  {
    id: 'ORD003',
    customerId: '3',
    customerName: 'আব্দুল হক এন্ড সন্স',
    items: [
      { productId: '3', productName: 'পাখি বালু', quantity: 80, price: 1500, total: 120000 },
      { productId: '7', productName: 'রড', quantity: 2, price: 75000, total: 150000 },
    ],
    total: 270000,
    status: 'pending',
    deliveryAddress: 'ধানমন্ডি, ঢাকা',
    createdAt: new Date('2024-11-06'),
    date: ''
  },
]

export const mockTransactions: Transaction[] = [
  { id: 'TRN001', description: 'বালু বিক্রয় - রহিম কন্সট্রাকশন', type: 'income', amount: 220000, category: 'Sales', date: new Date('2024-11-01') },
  { id: 'TRN002', description: 'ট্রাক জ্বালানি', type: 'expense', amount: 5000, category: 'Fuel', date: new Date('2024-11-02') },
  { id: 'TRN003', description: 'কর্মচারী বেতন', type: 'expense', amount: 150000, category: 'Salary', date: new Date('2024-11-03') },
  { id: 'TRN004', description: 'সিমেন্ট বিক্রয় - করিম বিল্ডার্স', type: 'income', amount: 240000, category: 'Sales', date: new Date('2024-11-05') },
  { id: 'TRN005', description: 'অফিস ভাড়া', type: 'expense', amount: 50000, category: 'Rent', date: new Date('2024-11-01') },
]
