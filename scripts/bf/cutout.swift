import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import AppKit

// usage: cutout in.jpg out.jpg [size]  -> subject cut out, centred on a plain light square
let args = CommandLine.arguments
guard args.count >= 3, let data = FileManager.default.contents(atPath: args[1]), let nsimg = NSImage(data: data),
      let cg = nsimg.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("FAIL load"); exit(1) }
let size = args.count > 3 ? CGFloat(Int(args[3]) ?? 1000) : 1000
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
do { try handler.perform([req]) } catch { print("FAIL vision \(error)"); exit(2) }
guard let obs = req.results?.first, !obs.allInstances.isEmpty else { print("FAIL nosubject"); exit(3) }
guard let maskBuf = try? obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler) else { print("FAIL mask"); exit(4) }
let ci = CIImage(cgImage: cg); let mask = CIImage(cvPixelBuffer: maskBuf)
let clear = CIImage(color: .clear).cropped(to: ci.extent)
let blend = CIFilter.blendWithMask(); blend.inputImage = ci; blend.backgroundImage = clear; blend.maskImage = mask
guard let cut = blend.outputImage else { print("FAIL blend"); exit(5) }
// crop to the subject's bounding box
let ctx = CIContext()
guard let cutCG = ctx.createCGImage(cut, from: ci.extent) else { print("FAIL cg"); exit(6) }
let rep = NSBitmapImageRep(cgImage: cutCG)
// find opaque bounds
var minX = rep.pixelsWide, minY = rep.pixelsHigh, maxX = 0, maxY = 0
for y in stride(from: 0, to: rep.pixelsHigh, by: 2) { for x in stride(from: 0, to: rep.pixelsWide, by: 2) {
    if let c = rep.colorAt(x: x, y: y), c.alphaComponent > 0.5 { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) } } }
if maxX <= minX || maxY <= minY { print("FAIL empty"); exit(7) }
let box = CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
let areaShare = (box.width * box.height) / CGFloat(rep.pixelsWide * rep.pixelsHigh)
// how much of the photo is subject, and how many photo edges the subject touches (a subject touching 3-4 edges
// usually means a poster, a pack shot or a cropped photo, where a cut-out adds nothing)
var subj = 0, total = 0
for y in stride(from: 0, to: rep.pixelsHigh, by: 4) { for x in stride(from: 0, to: rep.pixelsWide, by: 4) { total += 1; if let c = rep.colorAt(x: x, y: y), c.alphaComponent > 0.5 { subj += 1 } } }
let frac = Double(subj) / Double(max(total, 1))
let edge = 6
var edges = 0
if minX <= edge { edges += 1 }; if minY <= edge { edges += 1 }; if maxX >= rep.pixelsWide - edge - 2 { edges += 1 }; if maxY >= rep.pixelsHigh - edge - 2 { edges += 1 }
guard let cropped = cutCG.cropping(to: box) else { print("FAIL crop"); exit(8) }
let canvas = NSImage(size: NSSize(width: size, height: size))
canvas.lockFocus()
NSColor(calibratedRed: 0.97, green: 0.96, blue: 0.97, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: size, height: size).fill()
let inner = size * 0.86; let scale = min(inner / box.width, inner / box.height)
let w = box.width * scale, h = box.height * scale
NSImage(cgImage: cropped, size: NSSize(width: w, height: h)).draw(in: NSRect(x: (size - w) / 2, y: (size - h) / 2, width: w, height: h))
canvas.unlockFocus()
guard let tiff = canvas.tiffRepresentation, let out = NSBitmapImageRep(data: tiff)?.representation(using: .jpeg, properties: [.compressionFactor: 0.88]) else { print("FAIL write"); exit(9) }
try out.write(to: URL(fileURLWithPath: args[2]))
print(String(format: "OK frac=%.3f box=%.3f edges=%d w=%d h=%d", frac, areaShare, edges, rep.pixelsWide, rep.pixelsHigh))
