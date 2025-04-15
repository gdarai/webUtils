import React from 'react';
import { Button } from '@heroui/button';
import { useNavigate } from "@remix-run/react";

export const NavButton = ({ id, children, link }) => {
  const navigate = useNavigate();
  return (
    <Button
      onPress={() => navigate(link)}
      key={id}
      id={id}
    >{children}</Button>
  );
};

export default NavButton;