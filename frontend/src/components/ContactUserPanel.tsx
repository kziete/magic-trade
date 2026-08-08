"use client";

import { useState } from "react";
import { Drawer, Stack, Textarea, Button, Alert } from "@mantine/core";
import { useContactUserMutation } from "@/lib/api";

interface ContactUserPanelProps {
  username: string;
  opened: boolean;
  onClose: () => void;
}

export default function ContactUserPanel({
  username,
  opened,
  onClose,
}: ContactUserPanelProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [contactUser, { isLoading: isContacting }] = useContactUserMutation();

  const resetForm = () => {
    setMessage("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Por favor escribe un mensaje");
      return;
    }

    try {
      await contactUser({ username, message: trimmedMessage }).unwrap();
      setSuccess(true);
      setMessage("");
    } catch {
      setError("Error al enviar el mensaje");
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title={`Contactar a ${username}`}
      position="right"
      size="sm"
    >
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}
        {success && <Alert color="green">Mensaje enviado exitosamente</Alert>}

        <Textarea
          label="Mensaje"
          placeholder="Aquí incluye lo que buscas o tienes"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          minRows={4}
          autosize
        />

        <Button onClick={handleSubmit} loading={isContacting} disabled={!message.trim()}>
          Enviar mensaje
        </Button>
      </Stack>
    </Drawer>
  );
}
