'use client';

import type { BlocksCtaButtons } from '@/types/cms';
import { CtaButtonGroup, hasCtaButtons } from '@/components/ui/CtaButtonGroup';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksCtaButtons;
  locale: string;
};

export function CtaButtonsBlock({ block, locale }: Props) {
  if (!hasCtaButtons(block.buttons)) return null;

  return (
    <ThemeSection>
      <CtaButtonGroup buttons={block.buttons} locale={locale} />
    </ThemeSection>
  );
}
