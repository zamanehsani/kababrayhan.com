interface DesktopItemDescriptionProps {
  html: string;
}

export function DesktopItemDescription({
  html,
}: Readonly<DesktopItemDescriptionProps>) {
  return (
    <div
      className="prose prose-sm max-w-none font-sans leading-relaxed tracking-wide text-slate-700 prose-p:my-1 prose-p:text-xs prose-p:text-slate-700 prose-strong:text-xs prose-strong:font-normal prose-strong:text-slate-900 prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5 prose-li:text-xs prose-li:text-slate-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
