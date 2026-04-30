const PDFDocument = require("pdfkit");

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("en-US")} AZN`;
}

function generateInvoice({ order, res }) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="order-${order.id}-invoice.pdf"`);

  doc.pipe(res);

  doc.fontSize(24).font("Helvetica-Bold").text("DETALCENTER.AZ");
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica").fillColor("#475569").text(`Invoice for Order #${order.id}`);
  doc.moveDown();

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("Customer Info");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(11);
  doc.text(`Name: ${order.name}`);
  doc.text(`Phone: ${order.phone}`);
  doc.text(`Address: ${order.address}`);
  doc.text(`Note: ${order.note || "-"}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").fontSize(14).text("Order Info");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(11);
  doc.text(`Status: ${order.status}`);
  doc.text(`Created: ${new Date(order.createdAt).toLocaleString("en-US")}`);
  doc.text(`Total: ${formatCurrency(order.total)}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").fontSize(14).text("Products");
  doc.moveDown(0.75);

  const startX = doc.x;
  const quantityX = 340;
  const priceX = 420;
  const totalX = 500;

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Product", startX, doc.y);
  doc.text("Qty", quantityX, doc.y - 12);
  doc.text("Price", priceX, doc.y - 12);
  doc.text("Line Total", totalX, doc.y - 12);
  doc.moveDown(0.5);

  order.items.forEach((item) => {
    const lineTotal = Number(item.product?.price || 0) * Number(item.quantity || 0);
    const rowY = doc.y;

    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    doc.text(item.product?.name || "-", startX, rowY, { width: 260 });
    doc.text(String(item.quantity || 0), quantityX, rowY);
    doc.text(formatCurrency(item.product?.price || 0), priceX, rowY);
    doc.text(formatCurrency(lineTotal), totalX, rowY);
    doc.moveDown(0.8);
  });

  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(13).text(`Grand Total: ${formatCurrency(order.total)}`, {
    align: "right",
  });

  doc.end();
}

module.exports = {
  generateInvoice,
};
