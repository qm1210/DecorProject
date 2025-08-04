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

export const useExport = () => {
  const exportToCSV = useCallback((products: Product[], totalPrice: number) => {
    if (products.length === 0) {
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
    if (products.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const element = document.createElement("div");
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 24px; font-weight: bold;">NỘI THẤT YOTECH</h1>
            <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 20px;">BẢNG BÁO GIÁ</h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}</p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Tổng sản phẩm: ${products.length}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">STT</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Danh mục</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Đầu mục</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Tên cốt</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Tên phủ</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Đơn vị</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">Đơn giá</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">SL</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((product, index) => `
                <tr style="${index % 2 === 0 ? "background-color: #f9fafb;" : ""}">
                  <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px;">${product.category || "Khác"}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px;">${product.subcategory || "Khác"}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px;">${product.core || "Khác"}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px;">${product.cover || "Khác"}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px;">${product.unit || ""}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px; text-align: right; color: #059669; font-weight: 600;">${formatCurrency(product.price || 0)}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px; text-align: center;">${product.quantity || 0}</td>
                  <td style="border: 1px solid #d1d5db; padding: 6px; text-align: right; color: #2563eb; font-weight: 600;">${formatCurrency((product.price || 0) * (product.quantity || 0))}</td>
                </tr>
              `).join("")}
              <tr style="background-color: #e5e7eb; font-weight: bold;">
                <td colspan="8" style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">TỔNG CỘNG:</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #dc2626; font-weight: bold; font-size: 14px;">${formatCurrency(totalPrice)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">Cảm ơn quý khách đã quan tâm đến sản phẩm của chúng tôi!</p>
          </div>
        </div>
      `;

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

  const exportToImage = useCallback(async () => {
    try {
        const { domToPng } = await import("modern-screenshot");
        const tableElement = document.querySelector(".pdf-export-container") as HTMLElement;

        if (!tableElement) {
        alert("Không tìm thấy bảng để xuất ảnh!");
        return;
        }

        // ✅ modern-screenshot hỗ trợ tất cả CSS hiện đại
        const dataUrl = await domToPng(tableElement, {
        scale: 2,
        quality: 0.95,
        backgroundColor: '#ffffff',
        });

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