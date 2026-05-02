import Separator from '@/components/Separator/Separator'

const Title = ({ text }: { text: string }) => {
  return (
    <div className="w-full mt-3">
      <div className="text-primary-500 rounded text-base font-bold">{text}</div>
      <Separator className="mb-2" />
    </div>
  )
}

export default Title
