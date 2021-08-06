import { GetServerSideProps } from 'next';
import App from '../index';
import fetchSnack from '../../components/fetchSnack';
import { RouterData } from '../../components/types';

type Props = {
  data: RouterData;
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const id = context.params.id as string;
  const data = await fetchSnack(context, id);
  return { props: { data } };
};

export default function EmbeddedProject(props: Props) {
  const { data } = props;
  return <App data={data} />;
}
