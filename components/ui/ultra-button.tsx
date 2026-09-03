'use client';

import { Button, type ButtonProps } from 'react-aria-components';
import { motion } from 'motion/react';

const MotionButton = motion.create(Button);

export function UltraButton(props: ButtonProps & { className?: string }) {
  return (
    <MotionButton
      {...props}
      className={props.className ?? 'button button-dark'}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.16 }}
    />
  );
}
