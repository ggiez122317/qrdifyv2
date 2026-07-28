import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Students Management | QRidify',
  description: 'Manage and monitor all student records.',
};

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
