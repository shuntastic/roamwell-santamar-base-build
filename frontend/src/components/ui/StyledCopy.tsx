import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type BlocksNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  children?: BlocksNode[];
  level?: number;
  format?: string;
};

type Props = {
  content?: unknown;
  /** MUI Typography color token. Defaults to text.secondary. */
  color?: string;
};

function renderInline(nodes: BlocksNode[] = [], keyPrefix = 'i'): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'text' || node.text !== undefined) {
      let text: ReactNode = node.text ?? '';
      if (node.bold) text = <strong key={`${keyPrefix}-b-${index}`}>{text}</strong>;
      if (node.italic) text = <em key={`${keyPrefix}-i-${index}`}>{text}</em>;
      return <span key={`${keyPrefix}-${index}`}>{text}</span>;
    }

    if (node.children) {
      return (
        <span key={`${keyPrefix}-${index}`}>{renderInline(node.children, `${keyPrefix}-${index}`)}</span>
      );
    }

    return null;
  });
}

export function StyledCopy({ content, color = 'text.secondary' }: Props) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <Box
      className="styled-copy"
      sx={{
        '& p': { mb: 2 },
        '& h2, & h3': { mt: 3, mb: 1.5 },
        '& p:last-child, & ul:last-child, & ol:last-child': { mb: 0 },
        maxWidth: 760,
      }}
    >
      {(content as BlocksNode[]).map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <Typography key={index} component="p" variant="body1" color={color}>
              {renderInline(block.children, `p${index}`)}
            </Typography>
          );
        }

        if (block.type === 'heading') {
          const level = Math.min(Math.max(block.level ?? 2, 2), 4) as 2 | 3 | 4;
          return (
            <Typography key={index} component={`h${level}`} variant={`h${level}`} color={color}>
              {renderInline(block.children, `h${index}`)}
            </Typography>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
          return (
            <Box key={index} component={ListTag} sx={{ pl: 3, mb: 2 }}>
              {(block.children ?? []).map((item, itemIndex) => (
                <Typography key={itemIndex} component="li" variant="body1" color={color}>
                  {renderInline(item.children, `l${index}-${itemIndex}`)}
                </Typography>
              ))}
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
}
