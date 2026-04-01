export function enableRealtime(sb, table, onChange) {
  const ch = sb.channel(`rt:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
    .subscribe();
  return () => sb.removeChannel(ch);
}
