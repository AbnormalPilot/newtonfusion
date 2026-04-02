import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"

function getBlobConfig() {
  const token = "vercel_blob_rw_P7RvilaKMiY3GjId_Fwvrk9M6RvWnzlNDlg7U6LD6U4G7MV"
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not configured. Please add it in Project Settings.")
  }
  return { token }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const blobConfig = getBlobConfig()

    const blobUrl = decodeURIComponent(params.id)

    if (!blobUrl || !blobUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    console.log("[v0] Deleting blob:", blobUrl)

    await del(blobUrl, blobConfig)

    console.log("[v0] Successfully deleted blob")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting track:", error)

    if (error instanceof Error && error.message.includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json(
        {
          error: "Blob storage not configured. Please add BLOB_READ_WRITE_TOKEN in Project Settings.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 })
  }
}
