// Server-compatible brand mark; adjacent text supplies the accessible brand name.
import Image from "next/image";
import { BRAND } from "@/config/brand";
export default function BrandLogo() {
  return <Image className="brand-logo" src={BRAND.logo} alt="" width={40} height={41} preload unoptimized />;
}
