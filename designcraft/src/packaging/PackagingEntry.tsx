import { useState } from "react";
import { Box, ArrowUpLeft } from "lucide-react";
import type { ProjectItem } from "../types";
import { useDcLang } from "../hooks/useDcLang";
import { PackagingDialog } from "./PackagingDialog";
import { cartonSvg, DEFAULT_CARTON } from "./geometry";
export function PackagingEntry({
  onCreate,
}: {
  onCreate: (p: ProjectItem) => void;
}) {
  const [open, setOpen] = useState(false),
    { lang } = useDcLang(),
    ar = lang === "ar";
  return (
    <>
      <section className="carton-entry" dir={ar ? "rtl" : "ltr"}>
        <div>
          <small>PACKAGING STUDIO · mm</small>
          <h2>
            <Box />
            {ar ? "صمّم علبتك بالمقاس" : "Build your box, to size"}
          </h2>
          <p>
            {ar
              ? "طول × عرض × عمق. قالب قصّ وطيّ بألسنة قفل ولصق، جاهز لتصميمك."
              : "Length × width × depth. A cut-and-fold template, ready for your artwork."}
          </p>
          <button type="button" onClick={() => setOpen(true)}>
            {ar ? "قوالب العلب والمقاسات" : "Carton templates & dimensions"}
            <ArrowUpLeft size={18} />
          </button>
        </div>
        <div
          className="carton-entry-thumb"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: cartonSvg(DEFAULT_CARTON) }}
        />
      </section>
      {open && (
        <PackagingDialog
          onClose={() => setOpen(false)}
          onCreate={(p) => {
            setOpen(false);
            onCreate(p);
          }}
        />
      )}
    </>
  );
}
