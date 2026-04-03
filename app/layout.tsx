import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Global Fetch Interceptor for JWT Auth */}
        <script dangerouslySetInnerHTML={{ __html: `
          const originalFetch = window.fetch;
          window.fetch = async function(...args) {
              let resource = args[0];
              let config = args[1];
              if (typeof resource === 'string' && resource.includes('/api/')) {
                  const token = localStorage.getItem('admin_token');
                  if (token) {
                      config = config || {};
                      config.headers = Object.assign({}, config.headers, {
                          'Authorization': 'Bearer ' + token
                      });
                      args[1] = config;
                  }
              }
              return originalFetch.apply(this, args);
          };
        `}} />
        {/* Microsoft Clarity */}
        <Script
          id="microsoft-clarity"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vv2nqvvyjk");
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
