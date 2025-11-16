export async function POST(request) {
  const { items } = await request.json();
  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json({ message: 'No items' }, { status: 400 });
  }
  return Response.json({ ok: true, message: 'Compra simulada' });
}
