'use client';

import { Button, type ButtonProps } from 'react-aria-components';
import { motion } from 'motion/react';
import type { ComponentProps } from 'react';

export function UltraButton(props: ButtonProps & { className?: string }) {
  return (
    <Button
      {...props}
      className={props.className ?? 'button button-dark'}
      style={{ position: 'relative', ...props.style } as ComponentProps<typeof Button>['style']}
      render={(renderProps) => (
        <motion.button
          {...renderProps}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.16 }}
        />
      )}
    />
  );
}
