// Track sources by family so an edited font can replace a previously loaded one.
export function createFontRuntime(font, React, replace = null) {
  const sources = new Map();
  let queue = Promise.resolve();
  function loadAsync(name, source) {
    const definitions = Array.isArray(name);
    const map = definitions
      ? Object.create(null)
      : typeof name === 'string'
        ? { [name]: source }
        : name;
    if (definitions)
      for (const definition of name) {
        (map[definition.fontFamily] ||= []).push(definition);
      }
    const task = queue.then(async () => {
      for (const [family, value] of Object.entries(map)) {
        const signature = JSON.stringify(value);
        if (sources.has(family) && sources.get(family) !== signature && font.isLoaded(family)) {
          if (replace) {
            await replace(family, value, definitions);
            sources.set(family, signature);
            continue;
          }
          await font.unloadAsync(family);
        }
        if (definitions) await font.loadAsync(value);
        else await font.loadAsync(family, value);
        sources.set(family, signature);
      }
    });
    queue = task.catch(() => {});
    return task;
  }
  function useFonts(map) {
    const signature = JSON.stringify(map);
    const [state, setState] = React.useState({ signature: null, error: null });
    React.useEffect(() => {
      let active = true;
      loadAsync(map).then(
        () => {
          if (active) setState({ signature, error: null });
        },
        (error) => {
          if (active) setState({ signature, error });
        },
      );
      return () => {
        active = false;
      };
    }, [signature]);
    return [state.signature === signature && !state.error, state.error];
  }
  return { ...font, loadAsync, useFonts };
}
