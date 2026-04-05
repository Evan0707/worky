"use client";

import { MapPin, Navigation, Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AddressNavigationButtonProps {
  address: string;
}

export function AddressNavigationButton({ address }: AddressNavigationButtonProps) {
  const t = useTranslations("projects.navigation");

  const openInBrowser = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const encodedAddress = encodeURIComponent(address);

  // Waze: https://waze.com/ul?q=encodedAddress
  // Google Maps: https://www.google.com/maps/search/?api=1&query=encodedAddress
  // Apple Maps: maps://maps.apple.com/?q=encodedAddress

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8 gap-2 ml-auto shadow-sm">
          <Navigation className="h-3.5 w-3.5 text-blue-500" />
          <span className="hidden sm:inline">{t("openWith")}</span>
          <span className="sm:hidden">{t("mobileNav")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() =>
            openInBrowser(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`)
          }
        >
          <MapPin className="h-4 w-4 text-green-600" />
          Google Maps
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => openInBrowser(`https://waze.com/ul?q=${encodedAddress}`)}
        >
          <Navigation className="h-4 w-4 text-sky-500" />
          Waze
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => openInBrowser(`http://maps.apple.com/?q=${encodedAddress}`)}
        >
          <Compass className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          Apple Maps
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
