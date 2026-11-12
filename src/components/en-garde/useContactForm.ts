"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";

export type ContactFields = { name: string; email: string; message: string };

/**
 * Delivery hook for the contact form.
 * TODO: wire to a real backend (e.g. a Route Handler at /api/contact that sends an email).
 * The design only shows the success state, so this currently resolves immediately.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function submitContact(fields: ContactFields): Promise<void> {}

export function useContactForm() {
  const [fields, setFields] = useState<ContactFields>({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const setField = useCallback(
    (key: keyof ContactFields) => (value: string) => setFields((f) => ({ ...f, [key]: value })),
    [],
  );

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await submitContact(fields);
      setSent(true);
    },
    [fields],
  );

  /** Pre-fill the message (used by the RESUME buttons) and reopen the form. */
  const prefill = useCallback((message: string) => {
    setFields((f) => ({ ...f, message }));
    setSent(false);
  }, []);

  // stable identity so the (memoized) contact card only re-renders when the form changes
  return useMemo(() => ({ fields, sent, setField, onSubmit, prefill }), [fields, sent, setField, onSubmit, prefill]);
}

export type ContactForm = ReturnType<typeof useContactForm>;
