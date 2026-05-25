interface DesktopItemDescriptionProps {
  html: string;
}

export function DesktopItemDescription({
  html,
}: Readonly<DesktopItemDescriptionProps>) {
  return (
    <div
      className="prose prose-sm max-w-none font-sans leading-relaxed tracking-wide text-slate-400 prose-p:my-1 prose-p:text-xs prose-p:text-slate-400 prose-strong:text-xs prose-strong:font-normal prose-strong:text-slate-700 prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5 prose-li:text-xs"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
