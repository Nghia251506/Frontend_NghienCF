import React from "react";

// src/components/Footer.tsx
export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="text-center text-sm text-gray-400 mt-10 border-t pt-4">
            <p>
                © 2025 <strong>Freelancer Nguyễn Trọng Nghĩa</strong>. All rights reserved.
            </p>
            <p>
                Website được phát triển bởi <strong>Nguyễn Trọng Nghĩa</strong> — Liên hệ:
                <a href="mailto:yourname@gmail.com" className="text-blue-600 hover:underline"> ntn8530@gmail.com</a> - 0862273012
            </p>
        </footer>
    );
}
