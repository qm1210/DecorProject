import { useCallback } from 'react';
import formatCurrency from '@/utils/FormatCurrency';

interface Product {
  id: string;
  category?: string;
  subcategory?: string;
  core?: string;
  cover?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  note?: string;
}

function getExportHTML(products: Product[], totalPrice: number) {
  // Nếu không có sản phẩm, trả về HTML báo trống
  if (!products || products.length === 0) {
    return `
      <div style="padding: 40px; font-family: Arial, sans-serif; text-align: center;">
        <h2 style="color: #1f2937; font-size: 22px; font-weight: bold;">KHÔNG CÓ SẢN PHẨM ĐỂ XUẤT</h2>
      </div>
    `;
  }

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif; background: #fff; color: #222;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 24px; font-weight: bold;">NỘI THẤT YOTECH</h1>
        <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 20px;">BẢNG BÁO GIÁ</h1>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}</p>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Tổng sản phẩm: ${products.length}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; background: #fff;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: bold;">STT</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: bold;">Danh mục</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: bold;">Đầu mục</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: bold;">Tên cốt</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: bold;">Tên phủ</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: bold;">Đơn vị</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: bold;">Đơn giá</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: center; font-weight: bold;">SL</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: bold;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((product, index) => `
            <tr style="${index % 2 === 0 ? "background-color: #f9fafb;" : ""}">
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${product.category || "Khác"}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${product.subcategory || "Khác"}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${product.core || "Khác"}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${product.cover || "Khác"}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${product.unit || ""}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #059669; font-weight: 600;">${formatCurrency(product.price || 0)}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${product.quantity || 0}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #2563eb; font-weight: 600;">${formatCurrency((product.price || 0) * (product.quantity || 0))}</td>
            </tr>
          `).join("")}
          <tr style="background-color: #e5e7eb; font-weight: bold;">
            <td colspan="8" style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: bold;">TỔNG CỘNG:</td>
            <td style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; color: #dc2626; font-weight: bold; font-size: 15px;">${formatCurrency(totalPrice)}</td>
          </tr>
        </tbody>
      </table>
      <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px;">
        <p style="margin: 0;">Cảm ơn quý khách đã quan tâm đến sản phẩm của chúng tôi!</p>
      </div>
    </div>
  `;
}

export const useExport = () => {
  const exportToCSV = useCallback((products: Product[], totalPrice: number) => {
    if (!products || products.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const headers = [
      "Danh mục",
      "Đầu mục",
      "Tên cốt",
      "Tên phủ",
      "Đơn vị",
      "Đơn giá",
      "Số lượng",
      "Thành tiền",
      "Ghi chú",
    ];

    const csvContent = [
      headers.join(","),
      ...products.map((product) => {
        return [
          `"${product.category || "Khác"}"`,
          `"${product.subcategory || "Khác"}"`,
          `"${product.core || "Khác"}"`,
          `"${product.cover || "Khác"}"`,
          `"${product.unit || ""}"`,
          product.price || 0,
          product.quantity || 0,
          (product.price || 0) * (product.quantity || 0),
          `"${product.note || ""}"`,
        ].join(",");
      }),
      `"","","","","","","TỔNG CỘNG",${totalPrice},""`,
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bao-gia-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}-${String(new Date().getHours()).padStart(2, "0")}-${String(new Date().getMinutes()).padStart(2, "0")}-${String(new Date().getSeconds()).padStart(2, "0")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportToPDF = useCallback(async (products: Product[], totalPrice: number) => {
    if (!products || products.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.createElement("div");
      element.innerHTML = getExportHTML(products, totalPrice);

      const options = {
        margin: [10, 10, 10, 10],
        filename: `bao-gia-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}-${String(new Date().getHours()).padStart(2, "0")}-${String(new Date().getMinutes()).padStart(2, "0")}-${String(new Date().getSeconds()).padStart(2, "0")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Có lỗi khi xuất PDF! Vui lòng thử lại.");
    }
  }, []);

  const exportToImage = useCallback(async (products: Product[], totalPrice: number) => {
    if (!products || products.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
  
    try {
      const html2canvas = (await import("html2canvas")).default;
  
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = getExportHTML(products, totalPrice);
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.zIndex = "9999";
      tempDiv.style.background = "#fff";
      tempDiv.style.color = "#000";
      tempDiv.style.width = "900px";
      tempDiv.style.minHeight = "600px";
      tempDiv.style.boxSizing = "border-box";
      tempDiv.style.padding = "24px";
      tempDiv.id = "debug-export-image";
      document.body.appendChild(tempDiv);
  
      await new Promise((resolve) => setTimeout(resolve, 300));
  
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
  
      document.body.removeChild(tempDiv);
  
      const now = new Date();
      const filename = `bao-gia-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}.png`;
  
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Có lỗi khi xuất ảnh! Vui lòng thử lại.");
    }
  }, []);


  return {
    exportToCSV,
    exportToPDF,
    exportToImage,
  };
};