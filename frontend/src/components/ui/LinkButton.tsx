'use client';

import Button, { type ButtonProps } from '@mui/material/Button';
import Link from 'next/link';

type Props = ButtonProps & {
  href: string;
};

export function LinkButton({ href, ...props }: Props) {
  return <Button component={Link} href={href} {...props} />;
}
