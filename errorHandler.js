export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (req.file) {
    fs.unlink(req.file.path, () => {}); // Clean up uploaded file
  }

  res.status(500).render("error.ejs", {
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong!",
  });
};
