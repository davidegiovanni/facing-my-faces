import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async ({ params }) => {
  return redirect(`/${params.lang}`);
};

export default function FeedPage() {

  return (
    <div />
  );
}