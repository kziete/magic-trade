"use client";

import { useState } from "react";
import { Drawer, Stack, Textarea, Button, Alert } from "@mantine/core";
import { useContactUserMutation } from "@/lib/api";
import { useMessagesDrawer } from "@/lib/MessagesDrawerContext";

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
  const { open: openMessages } = useMessagesDrawer();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [contactUser, { isLoading: isContacting }] = useContactUserMutation();

  const resetForm = () => {
    setMessage("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Por favor escribe un mensaje");
      return;
    }

    try {
      const { conversation_id } = await contactUser({ username, message: trimmedMessage }).unwrap();
      resetForm();
      onClose();
      openMessages(conversation_id);
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
