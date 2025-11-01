import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Customer } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PurchaseHistoryItem {
  id: string
  date: Date
  productName: string
  quantity: number
  price: number
  total: number
  invoiceId: string
}

interface ProductSummary {
  quantity: number
  totalAmount: number
  transactions: number
  unit: string
}

export function generateCustomerPDF(
  customer: Customer,
  purchaseHistory: PurchaseHistoryItem[],
  productSummary: Record<string, ProductSummary>,
  locale: string
) {
  const doc = new jsPDF()
  
  // Set font for Bengali support
  doc.setFont('helvetica', 'normal')
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('Business Management System', 20, 20)
  
  doc.setFontSize(16)
  doc.setTextColor(100, 100, 100)
  doc.text('Customer Details Report', 20, 30)
  
  // Customer Information
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Customer Information', 20, 50)
  
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(`Name: ${customer.name}`, 20, 65)
  doc.text(`Phone: ${customer.phone}`, 20, 75)
  doc.text(`Address: ${customer.address}`, 20, 85)
  doc.text(`Customer Since: ${formatDate(customer.createdAt, locale)}`, 20, 95)
  doc.text(`Total Orders: ${customer.totalOrders}`, 20, 105)
  doc.text(`Total Spent: ${formatCurrency(customer.totalSpent, locale)}`, 20, 115)
  
  // Products Summary Table
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Products Purchased Summary', 20, 135)
  
  const productData = Object.entries(productSummary).map(([productName, data]) => [
    productName,
    `${data.quantity} ${data.unit}`,
    data.transactions.toString(),
    formatCurrency(data.totalAmount, locale)
  ])
  
  autoTable(doc, {
    head: [['Product Name', 'Total Quantity', 'Transactions', 'Total Amount']],
    body: productData,
    startY: 145,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 84, 178] },
    margin: { top: 20 }
  })
  
  // Purchase History Table
  const finalY = (doc as any).lastAutoTable.finalY || 200
  
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Purchase History', 20, finalY + 20)
  
  const historyData = purchaseHistory.slice(0, 20).map(item => [ // Limit to 20 items to fit in PDF
    formatDate(item.date, locale),
    item.productName,
    item.quantity.toString(),
    formatCurrency(item.price, locale),
    formatCurrency(item.total, locale),
    item.invoiceId
  ])
  
  autoTable(doc, {
    head: [['Date', 'Product', 'Qty', 'Price', 'Total', 'Invoice']],
    body: historyData,
    startY: finalY + 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 84, 178] },
    margin: { top: 20 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 }
    }
  })
  
  // Footer
  const pageCount = (doc as any).internal?.getNumberOfPages?.() ?? 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      20,
      doc.internal.pageSize.height - 10
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    )
  }
  
  // Save the PDF
  doc.save(`customer-details-${customer.name}-${new Date().toISOString().split('T')[0]}.pdf`)
}

export function generateInvoicePDF(
  customer: Customer,
  invoice: any,
  locale: string
) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('INVOICE', 20, 20)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Invoice #: ${invoice.id}`, 20, 35)
  doc.text(`Date: ${formatDate(invoice.issueDate, locale)}`, 20, 45)
  doc.text(`Due Date: ${formatDate(invoice.dueDate, locale)}`, 20, 55)
  
  // Customer Info
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text('Bill To:', 20, 75)
  
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(customer.name, 20, 90)
  doc.text(customer.phone, 20, 100)
  doc.text(customer.address, 20, 110)
  
  // Items Table
  const itemsData = invoice.items.map((item: any) => [
    item.productName,
    item.quantity.toString(),
    formatCurrency(item.price, locale),
    formatCurrency(item.total, locale)
  ])
  
  autoTable(doc, {
    head: [['Product', 'Quantity', 'Price', 'Total']],
    body: itemsData,
    startY: 125,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 84, 178] },
    margin: { top: 20 }
  })
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 200
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text(`Total: ${formatCurrency(invoice.total, locale)}`, 20, finalY + 20)
  
  // Save the PDF
  doc.save(`invoice-${invoice.id}-${new Date().toISOString().split('T')[0]}.pdf`)
}
