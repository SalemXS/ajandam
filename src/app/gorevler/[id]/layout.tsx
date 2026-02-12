// This file enables the dynamic [id] route to work with Next.js static export.
// It tells Next.js to not generate any static pages at build time,
// but to allow client-side rendering at runtime.
export function generateStaticParams() {
    return [];
}

export default function TaskDetailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
