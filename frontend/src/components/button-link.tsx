import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

interface ButtonLinkProps
  extends Omit<ButtonProps, "render" | "nativeButton"> {
  href: string;
  target?: string;
  rel?: string;
}

// Button that navigates via next/link. Uses Base UI's render prop with
// nativeButton=false so it renders a semantic <a> without the button warning.
export function ButtonLink({
  href,
  target,
  rel,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Button
      {...props}
      nativeButton={false}
      render={<Link href={href} target={target} rel={rel} />}
    >
      {children}
    </Button>
  );
}
