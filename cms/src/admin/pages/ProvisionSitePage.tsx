import * as React from 'react';
import {
  Box,
  Button,
  Flex,
  Field,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  Typography,
  Alert,
} from '@strapi/design-system';
import { useFetchClient, Layouts } from '@strapi/strapi/admin';

type ProvisionResponse = {
  data: {
    site: {
      documentId: string;
      key: string;
      name: string;
      hostname: string;
      template: string;
      theme: string;
    };
    deployPack: {
      port: number;
      dir: string;
      files: string[];
    };
    corsHint: string;
  };
};

export default function ProvisionSitePage() {
  const { post } = useFetchClient();
  const [name, setName] = React.useState('');
  const [hostname, setHostname] = React.useState('');
  const [template, setTemplate] = React.useState('multi_page');
  const [theme, setTheme] = React.useState('coastal');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ProvisionResponse['data'] | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await post('/sites/provision', {
        name: name.trim(),
        hostname: hostname.trim(),
        template,
        theme,
      });
      const payload = (response.data || response) as ProvisionResponse | ProvisionResponse['data'];
      const data =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as ProvisionResponse).data
          : (payload as ProvisionResponse['data']);
      setResult(data);
      setName('');
      setHostname('');
    } catch (err: unknown) {
      let message = 'Provision failed';
      if (err && typeof err === 'object') {
        const maybe = err as {
          message?: string;
          response?: { data?: { error?: { message?: string }; message?: string } };
        };
        message =
          maybe.response?.data?.error?.message ||
          maybe.response?.data?.message ||
          maybe.message ||
          message;
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layouts.Root>
      <Layouts.Header
        title="Provision site"
        subtitle="Create a secondary Site, starter content, and a Next.js deployment pack under sites/<key>/."
      />
      <Layouts.Content>
        <Box
          as="form"
          onSubmit={onSubmit}
          background="neutral0"
          padding={6}
          hasRadius
          shadow="filterShadow"
          style={{ maxWidth: 560 }}
        >
          <Flex direction="column" alignItems="stretch" gap={4}>
            {error ? (
              <Alert
                closeLabel="Close"
                title="Could not provision site"
                variant="danger"
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            ) : null}

            {result ? (
              <Alert
                closeLabel="Close"
                title={`Created site “${result.site.key}” (port ${result.deployPack.port})`}
                variant="success"
                onClose={() => setResult(null)}
              >
                <Typography tag="p" variant="pi" textColor="neutral700">
                  Pack: {result.deployPack.dir}
                </Typography>
                <Typography tag="p" variant="pi" textColor="neutral700">
                  Files: {result.deployPack.files.join(', ')}
                </Typography>
                <Typography tag="p" variant="pi" textColor="neutral700">
                  {result.corsHint}
                </Typography>
              </Alert>
            ) : null}

            <Field.Root name="name" required>
              <Field.Label>Site name</Field.Label>
              <TextInput
                placeholder="Coast House"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </Field.Root>

            <Field.Root name="hostname" required hint="No protocol or port — exact Host match for DNS.">
              <Field.Label>Hostname</Field.Label>
              <TextInput
                placeholder="coast.example.com"
                value={hostname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHostname(e.target.value)}
              />
              <Field.Hint />
            </Field.Root>

            <Field.Root name="template" required>
              <Field.Label>Template</Field.Label>
              <SingleSelect value={template} onChange={(value) => setTemplate(String(value))}>
                <SingleSelectOption value="multi_page">
                  multi_page — classic page routes
                </SingleSelectOption>
                <SingleSelectOption value="single_page">
                  single_page — one page + section hash nav
                </SingleSelectOption>
              </SingleSelect>
            </Field.Root>

            <Field.Root name="theme" required>
              <Field.Label>Theme</Field.Label>
              <SingleSelect value={theme} onChange={(value) => setTheme(String(value))}>
                <SingleSelectOption value="coastal">
                  coastal — Atlantic teal, glass header
                </SingleSelectOption>
                <SingleSelectOption value="harbor">
                  harbor — ink & brass, solid header
                </SingleSelectOption>
                <SingleSelectOption value="dune">dune — warm sand & olive</SingleSelectOption>
                <SingleSelectOption value="blackbox">
                  blackbox — Widescreen & Mokoko, cool gray field
                </SingleSelectOption>
              </SingleSelect>
            </Field.Root>

            <Flex justifyContent="flex-end">
              <Button type="submit" loading={busy} disabled={!name.trim() || !hostname.trim()}>
                Create site & deployment pack
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Layouts.Content>
    </Layouts.Root>
  );
}
