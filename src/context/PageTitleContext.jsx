import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

const PageTitleContext = createContext({
  title: 'RecruitAI',
  setTitle: () => {},
});

export function PageTitleProvider({ children, defaultTitle = 'RecruitAI' }) {
  const [title, setTitleState] = useState(defaultTitle);
  const setTitle = useCallback((next) => {
    setTitleState(next || defaultTitle);
  }, [defaultTitle]);

  const value = useMemo(() => ({ title, setTitle }), [title, setTitle]);

  return (
    <PageTitleContext.Provider value={value}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle(title) {
  const { setTitle } = useContext(PageTitleContext);

  useEffect(() => {
    if (title == null || title === '') return undefined;
    setTitle(title);
    return () => setTitle('RecruitAI');
  }, [title, setTitle]);
}

export function usePageTitleState() {
  return useContext(PageTitleContext);
}
