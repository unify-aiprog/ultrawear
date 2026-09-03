'use client';

import { Button, type ButtonProps } from 'react-aria-components';
import { motion } from 'motion/react';

export function UltraButton(props: ButtonProps) {
  const className = props.className ?? 'button button-dark';

  return (
    <Button
      {...props}
      className={className}
      render={(domProps, { isPressed }) => (
        <motion.button
          {...domProps}
          animate={{ y: isPressed ? 0 : -2, scale: isPressed ? 0.98 : 1 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16 }}
        />
      )}
    />
  );
}
