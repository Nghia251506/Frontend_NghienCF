import React from "react";

// src/components/Footer.tsx
export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="text-center text-sm text-gray-400 mt-10 border-t pt-4">
            <p>
                © 2025 <strong>Chạm Khoảnh Khắc</strong>. All rights reserved.
            </p>
            <p>
                Website được phát triển bởi <strong>Chạm Khoảnh Khắc</strong>
            </p>
        </footer>
    );
}
