"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-[18px] w-[18px]" />,
        info: <Info className="h-[18px] w-[18px]" />,
        warning: <TriangleAlert className="h-[18px] w-[18px]" />,
        error: <OctagonX className="h-[18px] w-[18px]" />,
        loading: <LoaderCircle className="h-[18px] w-[18px] animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: [
            "!bg-[#1c1c1e] !text-white !border-0",
            "!rounded-2xl !px-4 !py-3.5 !gap-3",
            "!shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
            "!font-medium !text-sm !min-w-[280px]",
          ].join(" "),
          title: "!text-white !font-medium !text-sm",
          description: "!text-white/60 !text-xs",
          icon: "!text-white",
          success: "!bg-[#1c1c1e] !text-white !border-0",
          error: "!bg-[#1c1c1e] !text-white !border-0",
          warning: "!bg-[#1c1c1e] !text-white !border-0",
          info: "!bg-[#1c1c1e] !text-white !border-0",
          actionButton: "!bg-white !text-[#1c1c1e] !font-semibold !rounded-lg",
          cancelButton: "!bg-white/10 !text-white !rounded-lg",
          closeButton: "!bg-white/10 !text-white !border-0 !rounded-full",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
