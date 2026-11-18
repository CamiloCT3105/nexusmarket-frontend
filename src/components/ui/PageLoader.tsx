import { Spinner } from "./Spinner";

export function PageLoader() {
  return (
    <div className="flex justify-center py-24 text-brand-fg">
      <Spinner className="size-8" />
    </div>
  );
}
