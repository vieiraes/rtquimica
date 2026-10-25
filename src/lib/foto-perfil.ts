// Foto do perfil: corta em quadrado e reduz para 320x320 JPEG no navegador, envia para o bucket público "fotos"
// (<user_id>/foto.jpg) e grava o endereço em profiles.avatar_url.
import { supabase } from "./supabase";

const LADO = 320;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

async function reduzir(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const corte = Math.min(imagem.width, imagem.height);
  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  canvas.getContext("2d")!.drawImage(imagem, (imagem.width - corte) / 2, (imagem.height - corte) / 2, corte, corte, 0, 0, LADO, LADO);
  imagem.close();
  return await new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Não consegui ler a imagem."))), "image/jpeg", 0.85));
}

/** Devolve o novo avatar_url (com ?v= para o navegador não mostrar a foto antiga do cache) */
export async function enviarFoto(userId: string, arquivo: File): Promise<string> {
  if (!supabase) throw new Error("Sem conexão com o servidor.");
  if (!TIPOS.includes(arquivo.type)) throw new Error("Use uma foto em JPG, PNG ou WebP.");
  if (arquivo.size > 15 * 1024 * 1024) throw new Error("A foto passa de 15 MB. Escolha uma menor.");
  const caminho = `${userId}/foto.jpg`;
  const { error } = await supabase.storage.from("fotos").upload(caminho, await reduzir(arquivo), { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error("Não consegui enviar a foto. Tente de novo.");
  const url = `${supabase.storage.from("fotos").getPublicUrl(caminho).data.publicUrl}?v=${Date.now()}`;
  const { error: erroPerfil } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (erroPerfil) throw new Error("A foto foi enviada, mas não consegui salvar no perfil.");
  return url;
}

export async function removerFoto(userId: string) {
  if (!supabase) return;
  await supabase.storage.from("fotos").remove([`${userId}/foto.jpg`]);
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  if (error) throw new Error("Não consegui remover a foto.");
}
