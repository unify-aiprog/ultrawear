'use client';

import { Button, type ButtonProps } from 'react-aria-components';
import { motion } from 'motion/react';

type MotionSafeButtonProps = Omit<
  ButtonProps,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>;

export function UltraButton(props: MotionSafeButtonProps) {
  const className = props.className ?? 'button button-dark';

  return (
    <Button
      {...props}
      className={className}
      render={(domProps, { isPressed }) => {
        const {
          onAnimationStart,
          onAnimationEnd,
          onAnimationIteration,
          onDrag,
          onDragStart,
          onDragEnd,
          ...motionProps
        } = domProps;

        return (
          <motion.button
            {...motionProps}
            animate={{ y: isPressed ? 0 : -2, scale: isPressed ? 0.98 : 1 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16 }}
          />
        );
      }}
    />
  );
}
