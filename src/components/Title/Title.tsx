import Separator from "../Separator/Separator";

const Title = ({ text }: { text: string }) => {
  return (
    <>
      <div className="w-full">
        <div className="text-primary-500 rounded text-base font-bold">
          {text}
        </div>
        <Separator className="" />
      </div>
    </>
  );
};

export default Title;
