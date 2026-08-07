"use client";

import { useState, useRef } from "react";
import {
  Drawer,
  Stack,
  Select,
  Button,
  Alert,
  Checkbox,
  Text,
  Group,
  Box,
  List,
  Collapse,
} from "@mantine/core";
import { IconUpload, IconFile, IconX, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useImportInventoryMutation, ImportInventoryResult } from "@/lib/api";

interface ImportInventoryPanelProps {
  opened: boolean;
  onClose: () => void;
}

export default function ImportInventoryPanel({
  opened,
  onClose,
}: ImportInventoryPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>("moxfield");
  const [clearExisting, setClearExisting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportInventoryResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importInventory, { isLoading }] = useImportInventoryMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setError("Solo se permiten archivos CSV");
        return;
      }
      setSelectedFile(file);
      setError("");
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setError("Solo se permiten archivos CSV");
        return;
      }
      setSelectedFile(file);
      setError("");
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormat("moxfield");
    setClearExisting(false);
    setError("");
    setResult(null);
    setShowErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Selecciona un archivo CSV");
      return;
    }

    setError("");
    setResult(null);

    try {
      const importResult = await importInventory({
        file: selectedFile,
        format,
        clear: clearExisting,
      }).unwrap();

      setResult(importResult);
    } catch {
      setError("Error al importar el inventario");
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title="Importar Inventario"
      position="right"
      size="md"
    >
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}

        {result && (
          <Alert color={result.created > 0 ? "green" : "yellow"}>
            <Stack gap="xs">
              <Text fw={500}>
                {result.created} cartas importadas, {result.skipped} omitidas
              </Text>
              {result.errors.length > 0 && (
                <>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setShowErrors(!showErrors)}
                    rightSection={showErrors ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                  >
                    {showErrors ? "Ocultar" : "Ver"} errores ({result.errors.length})
                  </Button>
                  <Collapse in={showErrors}>
                    <List size="xs" spacing="xs">
                      {result.errors.slice(0, 20).map((err, i) => (
                        <List.Item key={i}>{err}</List.Item>
                      ))}
                      {result.errors.length > 20 && (
                        <List.Item>... y {result.errors.length - 20} más</List.Item>
                      )}
                    </List>
                  </Collapse>
                </>
              )}
            </Stack>
          </Alert>
        )}

        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--mantine-color-gray-4)",
            borderRadius: "var(--mantine-radius-md)",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: selectedFile ? "var(--mantine-color-blue-light)" : undefined,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: "none" }}
          />
          {selectedFile ? (
            <Group justify="center" gap="xs">
              <IconFile size={24} />
              <Text>{selectedFile.name}</Text>
              <Button
                variant="subtle"
                color="red"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <IconX size={16} />
              </Button>
            </Group>
          ) : (
            <Stack align="center" gap="xs">
              <IconUpload size={32} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed">Arrastra un archivo CSV o haz clic para seleccionar</Text>
            </Stack>
          )}
        </Box>

        <Select
          label="Formato"
          data={[
            { value: "moxfield", label: "Moxfield" },
          ]}
          value={format}
          onChange={(v) => setFormat(v || "moxfield")}
        />

        <Checkbox
          label="Limpiar inventario existente antes de importar"
          checked={clearExisting}
          onChange={(e) => setClearExisting(e.currentTarget.checked)}
        />

        <Button
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!selectedFile}
          leftSection={<IconUpload size={16} />}
        >
          Importar
        </Button>
      </Stack>
    </Drawer>
  );
}
