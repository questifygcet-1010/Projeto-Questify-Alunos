import EmptyState from '@/components/EmptyState/EmptyState';
import PageHeader from '@/components/PageHeader/PageHeader';
import { InfoIcon } from '@/components/icons';

/** Página provisória de outro squad: só mantém a navegação funcionando. */
export default function StubPage({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={<InfoIcon />}
        title="Em breve"
        description="Esta seção ainda está em construção."
      />
    </>
  );
}
