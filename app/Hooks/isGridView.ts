import { useAppContext } from '../Contexts/ThemeProvider';

const isGridView = () => {
  const { viewMode } = useAppContext();

  return viewMode === 'grid';
};

export default isGridView;
