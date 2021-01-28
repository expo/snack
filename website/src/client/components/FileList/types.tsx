export type TextFileEntry = Readonly<{
  item: {
    path: string;
    type: 'file';
    content: string;
    virtual?: true;
    asset?: false;
  };
  state: {
    isOpen?: boolean;
    isFocused?: boolean;
    isSelected?: boolean;
    isCreating?: boolean;
    isExpanded?: false;
    isError?: boolean;
    isLoading?: boolean;
  };
}>;

export type AssetFileEntry = Readonly<{
  item: {
    path: string;
    type: 'file';
    uri: string;
    asset: true;
    virtual?: true;
  };
  state: {
    isOpen?: boolean;
    isFocused?: boolean;
    isSelected?: boolean;
    isCreating?: boolean;
    isExpanded?: false;
    isError?: boolean;
    isLoading?: boolean;
  };
}>;

export type FolderEntry = Readonly<{
  item: {
    path: string;
    type: 'folder';
    asset?: false;
    virtual?: false;
  };
  state: {
    isOpen?: boolean;
    isFocused?: boolean;
    isExpanded?: boolean;
    isSelected?: boolean;
    isCreating?: boolean;
    isError?: boolean;
    isLoading?: boolean;
  };
}>;

export type FileSystemEntry = TextFileEntry | AssetFileEntry | FolderEntry;
